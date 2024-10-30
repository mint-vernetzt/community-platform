import {
  Button,
  CardContainer,
  OrganizationCard,
} from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
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
// import styles from "../../../common/design/styles/styles.css";

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

const i18nNS = [
  "routes/search/organizations",
  "datasets/organizationTypes",
  "datasets/focuses",
];
export const handle = {
  i18n: i18nNS,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { take, page, itemsPerPage } = getTakeParam(request);

  const sessionUser = await getSessionUser(authClient);

  const organizationsCount = await countSearchedOrganizations(
    searchQuery,
    sessionUser
  );

  const rawOrganizations = await searchOrganizationsViaLike(
    searchQuery,
    sessionUser,
    take
  );

  const enhancedOrganizations = [];

  for (const organization of rawOrganizations) {
    let enhancedOrganization = {
      ...organization,
      areas: organization.areas.map((relation) => relation.area.name),
      focuses: organization.focuses.map((relation) => relation.focus.slug),
      types: organization.types.map((item) => item.organizationType.slug),
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

  return json({
    organizations: enhancedOrganizations,
    count: organizationsCount,
    isLoggedIn: sessionUser !== null,
    pagination: {
      page,
      itemsPerPage,
    },
  });
};

export default function SearchView() {
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();
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
                  {t("more")}
                </Button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-primary">{t("empty")}</p>
      )}
    </section>
  );
}
