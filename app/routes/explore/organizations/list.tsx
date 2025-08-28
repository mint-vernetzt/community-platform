import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import {
  data,
  type LoaderFunctionArgs,
  useLoaderData,
  useNavigation,
} from "react-router";
import { ConformForm } from "~/components-next/ConformForm";
import { HiddenFilterInputsInContext } from "~/components-next/HiddenFilterInputs";
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
import { getFilterSchemes } from "../all.shared";
import {
  getAllOrganizations,
  getOrganizationIds,
  getTakeParam,
  VIEW_COOKIE_VALUES,
  viewCookie,
} from "../organizations.server";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  const submission = parseWithZod(searchParams, {
    schema: getFilterSchemes,
  });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );
  const take = getTakeParam(submission.value.orgPage);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["explore/organizations"];

  let filteredByVisibilityCount;
  let organizationIdsFilteredByVisibility;
  if (!isLoggedIn) {
    organizationIdsFilteredByVisibility = await getOrganizationIds({
      filter: submission.value.orgFilter,
      search: submission.value.search,
      isLoggedIn,
      language,
    });
    filteredByVisibilityCount = organizationIdsFilteredByVisibility.length;
  }

  const organizationIds = await getOrganizationIds({
    filter: submission.value.orgFilter,
    search: submission.value.search,
    isLoggedIn: true,
    language,
  });

  const organizationCount = organizationIds.length;

  const organizations = await getAllOrganizations({
    sortBy: submission.value.orgSortBy,
    take,
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
      // Filter team members
      enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
        (relation) => {
          type ProfileRelation = typeof relation.profile;
          const filteredProfile = filterProfileByVisibility<ProfileRelation>(
            relation.profile
          );
          return { ...relation, profile: { ...filteredProfile } };
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

    let background = enhancedOrganization.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.Card.Background.width,
            height: ImageSizes.Organization.Card.Background.height,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.Card.BlurredBackground.width,
            height: ImageSizes.Organization.Card.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Organization.Background;
      blurredBackground = DefaultImages.Organization.BlurredBackground;
    }

    const teamMembers = enhancedOrganization.teamMembers.map((relation) => {
      let avatar = relation.profile.avatar;
      let blurredAvatar;
      if (avatar !== null) {
        const publicURL = getPublicURL(authClient, avatar);
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.CardFooter.Avatar.width,
            height: ImageSizes.Profile.CardFooter.Avatar.height,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.CardFooter.BlurredAvatar.width,
            height: ImageSizes.Profile.CardFooter.BlurredAvatar.height,
          },
          blur: BlurFactor,
        });
      }
      return {
        ...relation,
        profile: { ...relation.profile, avatar, blurredAvatar },
      };
    });

    const imageEnhancedOrganization = {
      ...enhancedOrganization,
      logo,
      blurredLogo,
      background,
      blurredBackground,
      teamMembers,
    };

    const transformedOrganization = {
      ...imageEnhancedOrganization,
      teamMembers: imageEnhancedOrganization.teamMembers.map((relation) => {
        return relation.profile;
      }),
      types: imageEnhancedOrganization.types.map((relation) => {
        return relation.organizationType.slug;
      }),
      networkTypes: imageEnhancedOrganization.networkTypes.map((relation) => {
        return relation.networkType.slug;
      }),
      focuses: imageEnhancedOrganization.focuses.map((relation) => {
        return relation.focus.slug;
      }),
      areas: imageEnhancedOrganization.areas.map((relation) => {
        return relation.area.name;
      }),
    };

    enhancedOrganizations.push(transformedOrganization);
  }

  const viewCookieHeader = {
    "Set-Cookie": await viewCookie.serialize(VIEW_COOKIE_VALUES.list),
  };
  return data(
    {
      filteredByVisibilityCount,
      organizations: enhancedOrganizations,
      organizationCount,
      locales,
      isLoggedIn,
      submission,
    },
    {
      headers: viewCookieHeader,
    }
  );
}

export default function ExploreOrganizationsList() {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  let showMore = false;
  if (typeof loaderData !== "undefined") {
    if (typeof loaderData.filteredByVisibilityCount !== "undefined") {
      showMore =
        loaderData.filteredByVisibilityCount > loaderData.organizations.length;
    } else {
      showMore = loaderData.organizationCount > loaderData.organizations.length;
    }
  }

  return (
    <>
      <CardContainer type="multi row">
        {loaderData.organizations.map((organization) => {
          return (
            <OrganizationCard
              locales={loaderData.locales}
              key={`organization-${organization.id}`}
              publicAccess={!loaderData.isLoggedIn}
              organization={organization}
              as="h2"
              prefetch="intent"
            />
          );
        })}
      </CardContainer>
      {showMore && (
        <div className="mv-w-full mv-flex mv-justify-center mv-mb-10 mv-mt-4 @lg:mv-mb-12 @lg:mv-mt-6 @xl:mv-mb-14 @xl:mv-mt-8">
          <ConformForm
            useFormOptions={{
              id: "load-more-organizations",
              defaultValue: {
                ...loaderData.submission.value,
                orgPage: loaderData.submission.value.orgPage + 1,
                search: [loaderData.submission.value.search.join(" ")],
                showFilters: "",
              },
              constraint: getZodConstraint(getFilterSchemes),
              lastResult:
                navigation.state === "idle" ? loaderData.submission : null,
            }}
            formProps={{
              method: "get",
              preventScrollReset: true,
              replace: true,
            }}
          >
            <HiddenFilterInputsInContext />
            <Button
              type="submit"
              size="large"
              variant="outline"
              loading={navigation.state === "loading"}
              disabled={navigation.state === "loading"}
            >
              {loaderData.locales.route.more}
            </Button>
          </ConformForm>
        </div>
      )}
    </>
  );
}
