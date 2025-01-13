import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import {
  countSearchedProfiles,
  getQueryValueAsArrayOfWords,
  getTakeParam,
  searchProfilesViaLike,
} from "./utils.server";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { ProfileCard } from "@mint-vernetzt/components/src/organisms/cards/ProfileCard";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["search/profiles"];

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { take, page, itemsPerPage } = getTakeParam(request);

  const sessionUser = await getSessionUser(authClient);

  let profilesCount: Awaited<ReturnType<typeof countSearchedProfiles>>;
  let rawProfiles: Awaited<ReturnType<typeof searchProfilesViaLike>>;
  if (searchQuery.length === 0) {
    profilesCount = 0;
    rawProfiles = [];
  } else {
    const profilesCountQuery = countSearchedProfiles(searchQuery, sessionUser);
    const rawProfilesQuery = searchProfilesViaLike(
      searchQuery,
      sessionUser,
      take
    );
    const [profilesCountResult, rawProfilesResult] =
      await prismaClient.$transaction([profilesCountQuery, rawProfilesQuery]);
    profilesCount = profilesCountResult;
    rawProfiles = rawProfilesResult;
  }

  const enhancedProfiles = [];

  for (const profile of rawProfiles) {
    let enhancedProfile = {
      ...profile,
      areas: profile.areas.map((item) => item.area.name),
      offers: profile.offers.map((item) => item.offer.slug),
      memberOf: profile.memberOf.map((relation) => {
        return relation.organization;
      }),
    };

    if (sessionUser === null) {
      // Filter profile
      type EnhancedProfile = typeof enhancedProfile;
      enhancedProfile =
        filterProfileByVisibility<EnhancedProfile>(enhancedProfile);
      // Filter organizations where profile belongs to
      enhancedProfile.memberOf = enhancedProfile.memberOf.map(
        (organization) => {
          type Organization = typeof organization;
          const filteredOrganization =
            filterOrganizationByVisibility<Organization>(organization);
          return { ...filteredOrganization };
        }
      );
    }

    // Add imgUrls for imgproxy call on client
    let avatar = enhancedProfile.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Profile.Card.Avatar },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Profile.Card.BlurredAvatar },
          blur: BlurFactor,
        });
      }
    }

    let background = enhancedProfile.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        background = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Profile.Card.Background },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.Card.BlurredBackground,
          },
          blur: BlurFactor,
        });
      }
    }

    const memberOf = enhancedProfile.memberOf.map((organization) => {
      let logo = organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        logo = getImageURL(publicURL, {
          resize: { type: "fit", ...ImageSizes.Organization.CardFooter.Logo },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fit",
            ...ImageSizes.Organization.CardFooter.BlurredLogo,
          },
          blur: BlurFactor,
        });
      }
      return { ...organization, logo, blurredLogo };
    });

    const imageEnhancedProfile = {
      ...enhancedProfile,
      avatar,
      blurredAvatar,
      background,
      blurredBackground,
      memberOf,
    };

    enhancedProfiles.push(imageEnhancedProfile);
  }

  return {
    profiles: enhancedProfiles,
    count: profilesCount,
    isLoggedIn: sessionUser !== null,
    pagination: {
      page,
      itemsPerPage,
    },
    locales,
  };
};

export default function Profiles() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const navigation = useNavigation();

  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${loaderData.pagination.page + 1}`);

  return (
    <section
      id="search-results-profiles"
      className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl"
    >
      {loaderData.profiles.length > 0 ? (
        <>
          <CardContainer type="multi row">
            {loaderData.profiles.map((profile) => {
              return (
                <ProfileCard
                  key={`profile-${profile.id}`}
                  publicAccess={!loaderData.isLoggedIn}
                  profile={profile}
                  locales={loaderData.locales}
                />
              );
            })}
          </CardContainer>
          {loaderData.count > loaderData.profiles.length && (
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
                  {loaderData.locales.route.more}
                </Button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-primary">
          {loaderData.locales.route.empty}
        </p>
      )}
    </section>
  );
}
