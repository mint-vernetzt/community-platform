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
import customMapStyles from "~/styles/map.css?url";
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
    "prfAreaSearch",
    "orgPage",
    "orgAreaSearch",
    "evtFilter.stage",
    "evtFilter.focus",
    "evtFilter.eventTargetGroup",
    "evtFilter.periodOfTime",
    "evtFilter.area",
    "evtSortBy",
    "evtPage",
    "evtAreaSearch",
    "prjFilter.discipline",
    "prjFilter.additionalDiscipline",
    "prjFilter.projectTargetGroup",
    "prjFilter.area",
    "prjFilter.format",
    "prjFilter.specialTargetGroup",
    "prjFilter.financing",
    "prjSortBy",
    "prjPage",
    "prjAreaSearch",
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
    <div className="mv-w-full mv-px-4">
      <div className="mv-w-full mv-relative mv-rounded-2xl mv-overflow-hidden mv-h-[calc(100dvh-292px)] mv-min-h-[284px] mv-mb-3 mv-ring-1 mv-ring-neutral-200">
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
      <div className="mv-hidden @lg:mv-flex mv-w-full mv-justify-end mv-mb-4 mv-gap-2 mv-px-2 @sm:mv-px-0">
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
                    className="mv-text-primary hover:mv-underline mv-w-fit mv-inline-flex"
                    prefetch="intent"
                  >
                    {" "}
                  </Link>,
                ]
              )}
            </p>
          </Modal.Section>
          <Modal.Section>
            <p className="mv-text-neutral-700 mv-font-semibold mv-leading-5 mv-text-sm">
              {loaderData.locales.route.map.embedModal.description.title}
            </p>
            <ul className="mv-flex mv-flex-col mv-gap-5 mv-text-sm">
              <li className="mv-flex mv-gap-2">
                <span className="mv-text-center mv-align-middle mv-h-[18px] mv-aspect-square mv-rounded-full mv-bg-primary-50 mv-text-xs mv-text-primary mv-font-semibold mv-leading-[16px] mv-mt-[2px]">
                  1
                </span>
                <span className="mv-text-primary mv-font-semibold mv-leading-5">
                  {loaderData.locales.route.map.embedModal.description.step1}
                </span>
              </li>
              <li className="mv-flex mv-gap-2">
                <span className="mv-text-center mv-align-middle mv-h-[18px] mv-aspect-square mv-rounded-full mv-bg-primary-50 mv-text-xs mv-text-primary mv-font-semibold mv-leading-[16px] mv-mt-[2px]">
                  2
                </span>
                <span className="mv-text-primary mv-font-semibold mv-leading-5">
                  {loaderData.locales.route.map.embedModal.description.step2}
                </span>
              </li>
              <li className="mv-flex mv-gap-2">
                <span className="mv-text-center mv-align-middle mv-h-[18px] mv-aspect-square mv-rounded-full mv-bg-primary-50 mv-text-xs mv-text-primary mv-font-semibold mv-leading-[16px] mv-mt-[2px]">
                  3
                </span>
                <span className="mv-text-primary mv-font-semibold mv-leading-5">
                  {loaderData.locales.route.map.embedModal.description.step3}
                </span>
              </li>
            </ul>
            <div className="mv-flex mv-flex-col mv-gap-1">
              <label
                htmlFor="embed-code"
                className="mv-text-neutral-700 mv-font-semibold mv-leading-5 mv-text-sm"
              >
                {loaderData.locales.route.map.embedModal.textarea.label}
              </label>
              <textarea
                id="embed-code"
                className="mv-w-full mv-h-[162px] mv-py-1 mv-px-2 mv-rounded-lg mv-border mv-border-neutral-300 mv-text-neutral-800 mv-font-semibold mv-leading-5 mv-text-base"
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
              className="mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-rounded-full mv-text-primary mv-w-5 mv-h-5 mv-border mv-border-primary mv-bg-neutral-50 hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
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
