import { parseWithZod } from "@conform-to/zod-v1";
import mapStyles from "maplibre-gl/dist/maplibre-gl.css?url";
import {
  useLoaderData,
  type LinksFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { createAuthClient } from "~/auth.server";
import { Map } from "~/components-next/Map";
import { detectLanguage } from "~/i18n.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { filterOrganizationByVisibility } from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { getFilterSchemes } from "./explore/all.shared";
import { checkFeatureAbilitiesOrThrow } from "./feature-access.server";
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
    const types = enhancedOrganization.types.map((item) => {
      return item.organizationType;
    });
    const networkTypes = enhancedOrganization.networkTypes.map((item) => {
      return item.networkType;
    });

    const imageEnhancedOrganization = {
      ...enhancedOrganization,
      logo,
      blurredLogo,
      types,
      networkTypes,
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

  return (
    <div className="mv-relative mv-w-screen mv-h-dvh">
      <Map organizations={organizations} locales={locales} />
    </div>
  );
}

export default MapIndex;
