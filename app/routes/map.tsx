import { parseWithZod } from "@conform-to/zod-v1";
import mapStyles from "maplibre-gl/dist/maplibre-gl.css?url";
import {
  redirect,
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
import customMapStyles from "~/styles/map/map.css?url";
import { getFilterSchemes } from "./explore/all.shared";
import { getAllOrganizations } from "./map.server";
import { getFeatureAbilities } from "./feature-access.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: mapStyles },
  { rel: "stylesheet", href: customMapStyles },
];

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["map"];

  const abilities = await getFeatureAbilities(authClient, "map_embed");
  if (abilities.map_embed.hasAccess === false) {
    return redirect("/");
  }

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

    // Add images from image proxy

    // Usage:
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

  return {
    organizations: enhancedOrganizations,
    locales,
    language,
  };
};

function MapIndex() {
  const { organizations, locales, language } = useLoaderData<typeof loader>();

  return (
    <div className="relative w-screen h-dvh min-h-[284px]">
      <Map
        organizations={organizations}
        locales={locales}
        language={language}
        embeddable
      />
    </div>
  );
}

export default MapIndex;
