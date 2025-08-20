import {
  data,
  Link,
  type LinksFunction,
  useRouteLoaderData,
} from "react-router";
import { type loader as parentLoader } from "../organizations";
import mapStyles from "maplibre-gl/dist/maplibre-gl.css?url";
import customMapStyles from "~/styles/map.css?url";
import { Map } from "~/components-next/Map";
import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { QuestionMark } from "~/components-next/icons/QuestionMark";
import { VIEW_COOKIE_VALUES, viewCookie } from "../organizations.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: mapStyles },
  { rel: "stylesheet", href: customMapStyles },
];

export async function loader() {
  const viewCookieHeader = {
    "Set-Cookie": await viewCookie.serialize(VIEW_COOKIE_VALUES.map),
  };
  return data(null, {
    headers: viewCookieHeader,
  });
}

export default function ExploreOrganizationsList() {
  const parentLoaderData = useRouteLoaderData<typeof parentLoader>(
    "routes/explore/organizations"
  );

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
      <div className="mv-w-full mv-flex mv-justify-end mv-mb-4 mv-gap-2 mv-px-2 @sm:mv-px-0">
        <TextButton size="small" as="link" to={""} preventScrollReset>
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
