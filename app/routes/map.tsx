import {
  useLoaderData,
  type LinksFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient } from "~/auth.server";
import { useEffect, useRef } from "react";
import maplibreGL from "maplibre-gl";
import mapStyles from "maplibre-gl/dist/maplibre-gl.css?url";
import { parseWithZod } from "@conform-to/zod-v1";
import { getFilterSchemes } from "./explore/all.shared";
import { invariantResponse } from "~/lib/utils/response";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { checkFeatureAbilitiesOrThrow } from "./feature-access.server";
import { filterOrganizationByVisibility } from "~/next-public-fields-filtering.server";
import { getAllOrganizations } from "./map.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: mapStyles },
];

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "map");
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["map"];

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const submission = parseWithZod(searchParams, {
    schema: getFilterSchemes,
  });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );

  const organizations = await getAllOrganizations({
    filter: submission.value.orgFilter,
    sortBy: submission.value.orgSortBy,
    search: submission.value.search,
    language,
  });

  const enhancedOrganizations = [];
  for (const organization of organizations) {
    type EnhancedOrganization = typeof organization;
    const enhancedOrganization =
      filterOrganizationByVisibility<EnhancedOrganization>(organization);

    // Add images from image proxy
    let logo = enhancedOrganization.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.Card.Logo.width,
            height: ImageSizes.Organization.Card.Logo.height,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.Card.BlurredLogo.width,
            height: ImageSizes.Organization.Card.BlurredLogo.height,
          },
          blur: BlurFactor,
        });
      }
    }

    const imageEnhancedOrganization = {
      ...enhancedOrganization,
      logo,
      blurredLogo,
    };

    enhancedOrganizations.push(imageEnhancedOrganization);
  }

  return {
    organizations: enhancedOrganizations,
    locales,
  };
};

function MapIndex() {
  const { organizations, locales } = useLoaderData<typeof loader>();
  console.log("Map organizations", organizations);
  console.log("Map locales", locales);

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibreGL.Map | null>(null);

  useEffect(() => {
    if (mapRef.current === null && mapContainer.current !== null) {
      const center = [10.451526, 51.165691] as [number, number];
      const maxBounds = [
        [-2, 46],
        [22, 56],
      ] as [[number, number], [number, number]];
      const zoom = 0;
      const minZoom = 5.2;
      const maxZoom = 12;
      // eslint-disable-next-line import/no-named-as-default-member
      mapRef.current = new maplibreGL.Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center,
        zoom,
        minZoom,
        maxZoom,
        maxBounds,
      });
      mapRef.current.addControl(
        // eslint-disable-next-line import/no-named-as-default-member
        new maplibreGL.NavigationControl({
          visualizePitch: true,
          visualizeRoll: true,
          showZoom: true,
          showCompass: false,
        })
      );
    }
  }, [mapContainer]);

  return (
    <div className="mv-relative mv-w-screen mv-h-dvh">
      <div ref={mapContainer} className="mv-absolute mv-w-full mv-h-full" />
    </div>
  );
}

export default MapIndex;
