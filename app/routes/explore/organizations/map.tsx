import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import mapStyles from "maplibre-gl/dist/maplibre-gl.css?url";
import {
  data,
  Link,
  type LinksFunction,
  type LoaderFunctionArgs,
  useLoaderData,
  useRouteLoaderData,
  useSearchParams,
} from "react-router";
import { QuestionMark } from "~/components-next/icons/QuestionMark";
import { Map } from "~/components-next/Map";
import { Modal } from "~/components-next/Modal";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { extendSearchParams } from "~/lib/utils/searchParams";
import customMapStyles from "~/styles/map.css?url";
import { type loader as parentLoader } from "../organizations";
import { VIEW_COOKIE_VALUES, viewCookie } from "../organizations.server";
import { useHydrated } from "remix-utils/use-hydrated";
import { copyToClipboard } from "~/lib/utils/clipboard";
import { useState } from "react";
import { detectLanguage } from "~/i18n.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: mapStyles },
  { rel: "stylesheet", href: customMapStyles },
];

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const language = await detectLanguage(request);

  const viewCookieHeader = {
    "Set-Cookie": await viewCookie.serialize(VIEW_COOKIE_VALUES.map),
  };
  return data(
    { lng: language },
    {
      headers: viewCookieHeader,
    }
  );
}

export default function ExploreOrganizationsList() {
  const parentLoaderData = useRouteLoaderData<typeof parentLoader>(
    "routes/explore/organizations"
  );
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

  return typeof parentLoaderData !== "undefined" ? (
    <div className="mv-w-full mv-px-4">
      <div className="mv-w-full mv-relative @sm:mv-rounded-2xl mv-overflow-hidden mv-h-[calc(100dvh-292px)] mv-mb-3 mv-ring-1 mv-ring-neutral-200">
        <Map
          organizations={parentLoaderData.organizations
            .filter((organization) => {
              return (
                organization.longitude !== null &&
                organization.latitude !== null
              );
            })
            .map((organization) => {
              return {
                ...organization,
                types: organization.types.map((type) => {
                  return {
                    slug: type,
                  };
                }),
                networkTypes: organization.networkTypes.map((type) => {
                  return {
                    slug: type,
                  };
                }),
              };
            })}
          locales={parentLoaderData.locales}
          language={parentLoaderData.language}
        />
      </div>
      <div className="mv-hidden @lg:mv-flex mv-w-full mv-justify-end mv-mb-4 mv-gap-2 mv-px-2 @sm:mv-px-0">
        <Modal searchParam="modal-embed">
          <Modal.Title>
            {parentLoaderData.locales.route.map.embedModal.title}
          </Modal.Title>
          <Modal.Section>
            <p>
              {insertComponentsIntoLocale(
                parentLoaderData.locales.route.map.embedModal.subline,
                [
                  <Link
                    key="help-link-in-modal"
                    to="/help#TODO"
                    target="_blank"
                    className="mv-text-primary hover:mv-underline mv-w-fit mv-inline-flex"
                  >
                    {" "}
                  </Link>,
                ]
              )}
            </p>
          </Modal.Section>
          <Modal.Section>
            <p className="mv-text-neutral-700 mv-font-semibold mv-leading-5 mv-text-sm">
              {parentLoaderData.locales.route.map.embedModal.description.title}
            </p>
            <ul className="mv-flex mv-flex-col mv-gap-5 mv-text-sm">
              <li className="mv-flex mv-gap-2">
                <span className="mv-text-center mv-align-middle mv-h-[18px] mv-aspect-square mv-rounded-full mv-bg-primary-50 mv-text-xs mv-text-primary mv-font-semibold mv-leading-[16px] mv-mt-[2px]">
                  1
                </span>
                <span className="mv-text-primary mv-font-semibold mv-leading-5">
                  {
                    parentLoaderData.locales.route.map.embedModal.description
                      .step1
                  }
                </span>
              </li>
              <li className="mv-flex mv-gap-2">
                <span className="mv-text-center mv-align-middle mv-h-[18px] mv-aspect-square mv-rounded-full mv-bg-primary-50 mv-text-xs mv-text-primary mv-font-semibold mv-leading-[16px] mv-mt-[2px]">
                  2
                </span>
                <span className="mv-text-primary mv-font-semibold mv-leading-5">
                  {
                    parentLoaderData.locales.route.map.embedModal.description
                      .step2
                  }
                </span>
              </li>
              <li className="mv-flex mv-gap-2">
                <span className="mv-text-center mv-align-middle mv-h-[18px] mv-aspect-square mv-rounded-full mv-bg-primary-50 mv-text-xs mv-text-primary mv-font-semibold mv-leading-[16px] mv-mt-[2px]">
                  3
                </span>
                <span className="mv-text-primary mv-font-semibold mv-leading-5">
                  {
                    parentLoaderData.locales.route.map.embedModal.description
                      .step3
                  }
                </span>
              </li>
            </ul>
            <div className="mv-flex mv-flex-col mv-gap-1">
              <label
                htmlFor="embed-code"
                className="mv-text-neutral-700 mv-font-semibold mv-leading-5 mv-text-sm"
              >
                {parentLoaderData.locales.route.map.embedModal.textarea.label}
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
              {parentLoaderData.locales.route.map.embedModal.copy}
            </Modal.SubmitButton>
          ) : null}
          <Modal.CloseButton>
            {parentLoaderData.locales.route.map.embedModal.cancel}
          </Modal.CloseButton>
          {hasCopied ? (
            <Modal.Alert position="relative">
              {parentLoaderData.locales.route.map.embedModal.copySuccess}
            </Modal.Alert>
          ) : null}
        </Modal>
        <TextButton
          size="small"
          as="link"
          to={`?${modalOpenSearchParams.toString()}`}
        >
          {parentLoaderData.locales.route.map.embed}
        </TextButton>
        <Link
          to="/help#TODO"
          target="_blank"
          className="mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-rounded-full mv-text-primary mv-w-5 mv-h-5 mv-border mv-border-primary mv-bg-neutral-50 hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
        >
          <QuestionMark />
        </Link>
      </div>
    </div>
  ) : null;
}
