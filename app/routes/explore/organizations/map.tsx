import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import mapStyles from "maplibre-gl/dist/maplibre-gl.css?url";
import { useState } from "react";
import {
  data,
  Link,
  type LinksFunction,
  type LoaderFunctionArgs,
  useLoaderData,
  useSearchParams,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { QuestionMark } from "~/components-next/icons/QuestionMark";
import { Map } from "~/components-next/Map";
import { Modal } from "~/components-next/Modal";
import { detectLanguage } from "~/i18n.server";
import { copyToClipboard } from "~/lib/utils/clipboard";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { extendSearchParams } from "~/lib/utils/searchParams";
import { getFeatureAbilities } from "~/routes/feature-access.server";
import customMapStyles from "~/styles/map/map.css?url";
import {
  getOrganizationIds,
  VIEW_COOKIE_VALUES,
  viewCookie,
} from "../organizations.server";
import { invariantResponse } from "~/lib/utils/response";
import { getFilterSchemes } from "../all.shared";
import { parseWithZod } from "@conform-to/zod-v1";
import { filterOrganizationByVisibility } from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { languageModuleMap } from "~/locales/.server";
import { getAllOrganizations } from "./map.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: mapStyles },
  { rel: "stylesheet", href: customMapStyles },
];

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["explore/organizations"];

  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, "map_embed");

  const submission = parseWithZod(searchParams, {
    schema: getFilterSchemes,
  });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let organizationIdsFilteredByVisibility;
  if (!isLoggedIn) {
    organizationIdsFilteredByVisibility = await getOrganizationIds({
      filter: submission.value.orgFilter,
      search: submission.value.search,
      isLoggedIn,
      language,
    });
  }

  const organizationIds = await getOrganizationIds({
    filter: submission.value.orgFilter,
    search: submission.value.search,
    isLoggedIn: true,
    language,
  });

  const organizations = await getAllOrganizations({
    sortBy: submission.value.orgSortBy,
    organizationIds:
      typeof organizationIdsFilteredByVisibility !== "undefined"
        ? organizationIdsFilteredByVisibility
        : organizationIds,
  });

  const enhancedOrganizations = [];
  for (const organization of organizations) {
    let enhancedOrganization = {
      ...organization,
    };

    if (!isLoggedIn) {
      // Filter organization
      type EnhancedOrganization = typeof enhancedOrganization;
      enhancedOrganization =
        filterOrganizationByVisibility<EnhancedOrganization>(
          enhancedOrganization
        );
      // Filter network members
      enhancedOrganization.networkMembers =
        enhancedOrganization.networkMembers.map((relation) => {
          type NetworkMemberRelation = typeof relation.networkMember;
          const filteredNetworkMember =
            filterOrganizationByVisibility<NetworkMemberRelation>(
              relation.networkMember
            );
          return { ...relation, networkMember: { ...filteredNetworkMember } };
        });
    }

    // Add images from image proxy
    let logo = enhancedOrganization.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.MapPopup.Logo.width,
            height: ImageSizes.Organization.MapPopup.Logo.height,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.MapPopup.BlurredLogo.width,
            height: ImageSizes.Organization.MapPopup.BlurredLogo.height,
          },
          blur: BlurFactor,
        });
      }
    }

    const networkMembers = enhancedOrganization.networkMembers.map(
      (relation) => {
        let logo = relation.networkMember.logo;
        let blurredLogo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.MapPopupNetworkMembers.Logo.width,
              height:
                ImageSizes.Organization.MapPopupNetworkMembers.Logo.height,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width:
                ImageSizes.Organization.MapPopupNetworkMembers.BlurredLogo
                  .width,
              height:
                ImageSizes.Organization.MapPopupNetworkMembers.BlurredLogo
                  .height,
            },
            blur: BlurFactor,
          });
        }
        return {
          ...relation,
          networkMember: {
            ...relation.networkMember,
            logo: logo,
            blurredLogo: blurredLogo,
          },
        };
      }
    );

    const imageEnhancedOrganization = {
      ...enhancedOrganization,
      logo,
      blurredLogo,
      networkMembers,
    };

    const transformedOrganization = {
      ...imageEnhancedOrganization,
      networkMembers: imageEnhancedOrganization.networkMembers.map(
        (relation) => {
          return relation.networkMember;
        }
      ),
      types: imageEnhancedOrganization.types.map((relation) => {
        return relation.organizationType;
      }),
      networkTypes: imageEnhancedOrganization.networkTypes.map((relation) => {
        return relation.networkType;
      }),
    };

    enhancedOrganizations.push(transformedOrganization);
  }

  const viewCookieHeader = {
    "Set-Cookie": await viewCookie.serialize(VIEW_COOKIE_VALUES.map),
  };

  return data(
    { lng: language, abilities, organizations: enhancedOrganizations, locales },
    {
      headers: viewCookieHeader,
    }
  );
}

export default function ExploreOrganizationsList() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const isHydrated = useHydrated();

  const modalOpenSearchParams = extendSearchParams(searchParams, {
    addOrReplace: {
      "modal-embed": "true",
    },
  });

  const searchQuery = searchParams.get("search");
  const removeParams = [
    "modal-embed",
    "showFilters",
    "prfFilter.offer",
    "prfFilter.area",
    "prfSortBy",
    "prfPage",
    "orgPage",
    "evtFilter.stage",
    "evtFilter.focus",
    "evtFilter.eventTargetGroup",
    "evtFilter.periodOfTime",
    "evtFilter.area",
    "evtSortBy",
    "evtPage",
    "prjFilter.discipline",
    "prjFilter.additionalDiscipline",
    "prjFilter.projectTargetGroup",
    "prjFilter.area",
    "prjFilter.format",
    "prjFilter.specialTargetGroup",
    "prjFilter.financing",
    "prjSortBy",
    "prjPage",
    "fndFilter.types",
    "fndFilter.areas",
    "fndFilter.regions",
    "fndFilter.eligibleEntities",
    "fndSortBy",
    "fndPage",
  ];

  if (searchQuery === null || searchQuery === "") {
    removeParams.push("search");
  }

  const embedLinkSearchParams = extendSearchParams(searchParams, {
    addOrReplace: {
      lng: loaderData.lng,
    },
    remove: removeParams,
  });
  const [hasCopied, setHasCopied] = useState(false);

  const iframeString = `<iframe width="100%" height="100%" src="${
    ENV.COMMUNITY_BASE_URL
  }/map?${embedLinkSearchParams.toString()}" title="MINTvernetzt-Community-Karte" referrerpolicy="no-referrer" allowfullscreen />`;

  return (
    <div className="w-full px-4">
      <div className="w-full relative rounded-2xl overflow-hidden h-[calc(100dvh-292px)] min-h-[284px] mb-3 ring-1 ring-neutral-200">
        <Map
          organizations={loaderData.organizations.filter((organization) => {
            return (
              organization.longitude !== null && organization.latitude !== null
            );
          })}
          locales={loaderData.locales}
          language={loaderData.lng}
        />
      </div>
      <div className="hidden @lg:flex w-full justify-end mb-4 gap-2 px-2 @sm:px-0">
        <Modal searchParam="modal-embed">
          <Modal.Title>
            {loaderData.locales.route.map.embedModal.title}
          </Modal.Title>
          <Modal.Section>
            <p>
              {insertComponentsIntoLocale(
                loaderData.locales.route.map.embedModal.subline,
                [
                  <Link
                    key="help-link-in-modal"
                    to="/help#organizationMapView-howToEmbedMapOnMyWebsite"
                    target="_blank"
                    className="text-primary hover:underline"
                    prefetch="intent"
                  >
                    {" "}
                  </Link>,
                ]
              )}
            </p>
          </Modal.Section>
          <Modal.Section>
            <p className="text-neutral-700 font-semibold leading-5 text-sm">
              {loaderData.locales.route.map.embedModal.description.title}
            </p>
            <ul className="flex flex-col gap-5 text-sm">
              <li className="flex gap-2">
                <span className="text-center align-middle h-[18px] aspect-square rounded-full bg-primary-50 text-xs text-primary font-semibold leading-[16px] mt-[2px]">
                  1
                </span>
                <span className="text-primary font-semibold leading-5">
                  {loaderData.locales.route.map.embedModal.description.step1}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-center align-middle h-[18px] aspect-square rounded-full bg-primary-50 text-xs text-primary font-semibold leading-[16px] mt-[2px]">
                  2
                </span>
                <span className="text-primary font-semibold leading-5">
                  {loaderData.locales.route.map.embedModal.description.step2}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-center align-middle h-[18px] aspect-square rounded-full bg-primary-50 text-xs text-primary font-semibold leading-[16px] mt-[2px]">
                  3
                </span>
                <span className="text-primary font-semibold leading-5">
                  {loaderData.locales.route.map.embedModal.description.step3}
                </span>
              </li>
            </ul>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="embed-code"
                className="text-neutral-700 font-semibold leading-5 text-sm"
              >
                {loaderData.locales.route.map.embedModal.textarea.label}
              </label>
              <textarea
                id="embed-code"
                className="w-full h-[162px] py-1 px-2 rounded-lg border border-neutral-300 text-neutral-800 font-semibold leading-5 text-base"
                value={iframeString}
                readOnly
              />
            </div>
          </Modal.Section>
          {isHydrated === true ? (
            <Modal.SubmitButton
              onClick={async () => {
                await copyToClipboard(iframeString);
                setHasCopied(true);
                setTimeout(() => {
                  setHasCopied(false);
                }, 2000);
              }}
            >
              {loaderData.locales.route.map.embedModal.copy}
            </Modal.SubmitButton>
          ) : null}
          <Modal.CloseButton>
            {loaderData.locales.route.map.embedModal.cancel}
          </Modal.CloseButton>
          {hasCopied ? (
            <Modal.Alert position="relative">
              {loaderData.locales.route.map.embedModal.copySuccess}
            </Modal.Alert>
          ) : null}
        </Modal>
        {loaderData.abilities.map_embed.hasAccess === true ? (
          <>
            <TextButton
              size="small"
              as="link"
              to={`?${modalOpenSearchParams.toString()}`}
              prefetch="intent"
            >
              {loaderData.locales.route.map.embed}
            </TextButton>
            <Link
              to="/help#organizationMapView-howToEmbedMapOnMyWebsite"
              target="_blank"
              className="grid grid-cols-1 grid-rows-1 place-items-center rounded-full text-primary w-5 h-5 border border-primary bg-neutral-50 hover:bg-primary-50 focus:bg-primary-50 active:bg-primary-100"
              prefetch="intent"
            >
              <QuestionMark />
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
