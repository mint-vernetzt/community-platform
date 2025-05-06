import type { LoaderFunctionArgs } from "react-router";
import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import {
  countSearchedOrganizations,
  getQueryValueAsArrayOfWords,
  getTakeParam,
  searchOrganizationsViaLike,
} from "./utils.server";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { DefaultImages } from "~/images.shared";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["search/organizations"];

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { take, page, itemsPerPage } = getTakeParam(request);

  const sessionUser = await getSessionUser(authClient);

  let organizationsCount: Awaited<
    ReturnType<typeof countSearchedOrganizations>
  >;
  let rawOrganizations: Awaited<ReturnType<typeof searchOrganizationsViaLike>>;
  if (searchQuery.length === 0) {
    organizationsCount = 0;
    rawOrganizations = [];
  } else {
    const organizationsCountQuery = countSearchedOrganizations({
      searchQuery,
      sessionUser,
      language,
    });
    const rawOrganizationsQuery = searchOrganizationsViaLike({
      searchQuery,
      sessionUser,
      take,
      language,
    });
    const [organizationsCountResult, rawOrganizationsResult] =
      await prismaClient.$transaction([
        organizationsCountQuery,
        rawOrganizationsQuery,
      ]);
    organizationsCount = organizationsCountResult;
    rawOrganizations = rawOrganizationsResult;
  }

  const enhancedOrganizations = [];

  for (const organization of rawOrganizations) {
    let enhancedOrganization = {
      ...organization,
      areas: organization.areas.map((relation) => relation.area.name),
      focuses: organization.focuses.map((relation) => relation.focus.slug),
      types: organization.types.map((item) => item.organizationType.slug),
      networkTypes: organization.networkTypes.map(
        (item) => item.networkType.slug
      ),
      teamMembers: organization.teamMembers.map((relation) => {
        return relation.profile;
      }),
    };

    if (sessionUser === null) {
      // Filter organization
      type EnhancedOrganization = typeof enhancedOrganization;
      enhancedOrganization =
        filterOrganizationByVisibility<EnhancedOrganization>(
          enhancedOrganization
        );
      // Filter team members
      enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
        (profile) => {
          type Profile = typeof profile;
          const filteredProfile = filterProfileByVisibility<Profile>(profile);
          return { ...filteredProfile };
        }
      );
    }

    // Add images from image proxy
    let logo = enhancedOrganization.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Organization.Card.Logo },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Organization.Card.BlurredLogo },
          blur: BlurFactor,
        });
      }
    }

    let background = enhancedOrganization.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        background = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Organization.Card.Background },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.Card.BlurredBackground,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Organization.Background;
      blurredBackground = DefaultImages.Organization.BlurredBackground;
    }

    const teamMembers = enhancedOrganization.teamMembers.map((profile) => {
      let avatar = profile.avatar;
      let blurredAvatar;
      if (avatar !== null) {
        const publicURL = getPublicURL(authClient, avatar);
        avatar = getImageURL(publicURL, {
          resize: { type: "fit", ...ImageSizes.Profile.CardFooter.Avatar },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fit",
            ...ImageSizes.Profile.CardFooter.BlurredAvatar,
          },
          blur: BlurFactor,
        });
      }
      return { ...profile, avatar, blurredAvatar };
    });

    const imageEnhancedOrganization = {
      ...enhancedOrganization,
      logo,
      blurredLogo,
      background,
      blurredBackground,
      teamMembers,
    };

    enhancedOrganizations.push(imageEnhancedOrganization);
  }

  return {
    organizations: enhancedOrganizations,
    count: organizationsCount,
    isLoggedIn: sessionUser !== null,
    pagination: {
      page,
      itemsPerPage,
    },
    locales,
  };
};

export default function SearchView() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const [searchParams] = useSearchParams();

  const navigation = useNavigation();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${loaderData.pagination.page + 1}`);

  return (
    <section
      id="search-results-organizations"
      className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl"
    >
      {loaderData.organizations.length > 0 ? (
        <>
          <CardContainer type="multi row">
            {loaderData.organizations.map((organization) => {
              return (
                <OrganizationCard
                  key={`profile-${organization.id}`}
                  publicAccess={!loaderData.isLoggedIn}
                  organization={organization}
                  locales={locales}
                />
              );
            })}
          </CardContainer>
          {loaderData.count > loaderData.organizations.length && (
            <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 @md:mv-mb-24 @lg:mv-mb-8 mv-mt-4 @lg:mv-mt-8">
              <Link
                to={`?${loadMoreSearchParams.toString()}`}
                preventScrollReset
                replace
              >
                <Button
                  size="large"
                  variant="outline"
                  loading={navigation.state === "loading"}
                  disabled={navigation.state === "loading"}
                >
                  {locales.route.more}
                </Button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-primary">{locales.route.empty}</p>
      )}
    </section>
  );
}
