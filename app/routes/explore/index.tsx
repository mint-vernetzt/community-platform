import { parseWithZod } from "@conform-to/zod-v1";
import { EventCard } from "@mint-vernetzt/components/src/organisms/cards/EventCard";
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
import { ProfileCard } from "@mint-vernetzt/components/src/organisms/cards/ProfileCard";
import { ProjectCard } from "@mint-vernetzt/components/src/organisms/cards/ProjectCard";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { type Organization, type Profile } from "@prisma/client";
import { utcToZonedTime } from "date-fns-tz";
import {
  Link,
  type LoaderFunctionArgs,
  useLoaderData,
  useSearchParams,
} from "react-router";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { FundingCard } from "~/components-next/FundingCard";
import { detectLanguage } from "~/i18n.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getPublicURL } from "~/storage.server";
import { enhanceEventsWithParticipationStatus } from "../dashboard.server";
import { getEventsSchema } from "./events";
import { getAllEvents } from "./events.server";
import { getFundingsSchema } from "./fundings";
import { getAllFundings } from "./fundings.server";
import { getOrganizationsSchema } from "./organizations";
import { getAllOrganizations } from "./organizations.server";
import { getProfilesSchema } from "./profiles";
import { getAllProfiles } from "./profiles.server";
import { getProjectsSchema } from "./projects";
import { getAllProjects } from "./projects.server";

const getSearchSchema = z.object({
  search: z
    .string()
    .optional()
    .transform((value) => {
      if (typeof value === "undefined") {
        return [];
      }
      const words = value.split(" ").filter((word) => {
        return word.length > 0;
      });
      return words;
    }),
});

export type GetSearchSchema = z.infer<typeof getSearchSchema>;

export const getFilterSchemes = getProfilesSchema
  .merge(getOrganizationsSchema)
  .merge(getEventsSchema)
  .merge(getProjectsSchema)
  .merge(getFundingsSchema)
  .merge(getSearchSchema);

export type FilterSchemes = z.infer<typeof getFilterSchemes>;

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
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

  const language = await detectLanguage(request);
  const locales = {
    index: languageModuleMap[language]["explore"].index,
    dashboard: languageModuleMap[language]["dashboard"],
    fundings: languageModuleMap[language]["explore/fundings"],
  };

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const numberOfEntities = 4;
  const numberOfFundings = 2;

  const rawProfiles = await getAllProfiles({
    filter: submission.value.prfFilter,
    sortBy: submission.value.prfSortBy,
    search: submission.value.search,
    sessionUser,
    take: numberOfEntities,
    language,
  });

  const profiles = rawProfiles.map((profile) => {
    const { avatar, background, memberOf, ...otherFields } = profile;
    const extensions: {
      memberOf: Pick<Organization, "name" | "slug" | "logo">[];
      areas: string[];
      offers: string[];
    } = { memberOf: [], areas: [], offers: [] };

    let avatarImage: string | null = null;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatarImage = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.Card.Avatar.width,
            height: ImageSizes.Profile.Card.Avatar.height,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.Card.BlurredAvatar.width,
            height: ImageSizes.Profile.Card.BlurredAvatar.height,
          },
          blur: BlurFactor,
        });
      }
    }

    let backgroundImage: string | null = null;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        backgroundImage = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.Card.Background.width,
            height: ImageSizes.Profile.Card.Background.height,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.Card.BlurredBackground.width,
            height: ImageSizes.Profile.Card.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      }
    } else {
      backgroundImage = DefaultImages.Profile.Background;
      blurredBackground = DefaultImages.Profile.BlurredBackground;
    }

    extensions.memberOf = memberOf.map((relation) => {
      let logoImage: string | null = null;
      let blurredLogo;
      if (relation.organization.logo !== null) {
        const publicURL = getPublicURL(authClient, relation.organization.logo);
        if (publicURL !== null) {
          logoImage = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.CardFooter.Logo.width,
              height: ImageSizes.Organization.CardFooter.Logo.height,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.CardFooter.BlurredLogo.width,
              height: ImageSizes.Organization.CardFooter.BlurredLogo.height,
            },
            blur: BlurFactor,
          });
        }
      }
      return { ...relation.organization, logo: logoImage, blurredLogo };
    });

    extensions.areas = profile.areas.map((relation) => {
      return relation.area.name;
    });

    extensions.offers = profile.offers.map((relation) => {
      return relation.offer.slug;
    });

    return {
      ...otherFields,
      ...extensions,
      avatar: avatarImage,
      blurredAvatar,
      background: backgroundImage,
      blurredBackground,
    };
  });

  const rawOrganizations = await getAllOrganizations({
    filter: submission.value.orgFilter,
    sortBy: submission.value.orgSortBy,
    search: submission.value.search,
    sessionUser,
    take: numberOfEntities,
    language,
  });

  const organizations = rawOrganizations.map((organization) => {
    const { logo, background, teamMembers, ...otherFields } = organization;
    const extensions: {
      teamMembers: Pick<
        Profile,
        "firstName" | "lastName" | "username" | "avatar"
      >[];
      focuses: string[];
      areas: string[];
      types: string[];
      networkTypes: string[];
    } = {
      teamMembers: [],
      focuses: [],
      areas: [],
      types: [],
      networkTypes: [],
    };

    let logoImage: string | null = null;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logoImage = getImageURL(publicURL, {
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

    let backgroundImage: string | null = null;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        backgroundImage = getImageURL(publicURL, {
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
      backgroundImage = DefaultImages.Organization.Background;
      blurredBackground = DefaultImages.Organization.BlurredBackground;
    }

    extensions.teamMembers = teamMembers.map((relation) => {
      let avatar: string | null = null;
      let blurredAvatar;
      if (relation.profile.avatar !== null) {
        const publicURL = getPublicURL(authClient, relation.profile.avatar);
        if (publicURL !== null) {
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
      }
      return { ...relation.profile, avatar: avatar, blurredAvatar };
    });

    extensions.areas = organization.areas.map((relation) => {
      return relation.area.name;
    });

    extensions.focuses = organization.focuses.map((relation) => {
      return relation.focus.slug;
    });

    extensions.types = organization.types.map((relation) => {
      return relation.organizationType.slug;
    });

    extensions.networkTypes = organization.networkTypes.map((relation) => {
      return relation.networkType.slug;
    });

    return {
      ...otherFields,
      ...extensions,
      logo: logoImage,
      blurredLogo,
      background: backgroundImage,
      blurredBackground,
    };
  });

  const rawEvents = await getAllEvents({
    filter: submission.value.evtFilter,
    sortBy: submission.value.evtSortBy,
    search: submission.value.search,
    sessionUser,
    take: numberOfEntities,
    language,
  });

  const rawEventsWithParticipationStatus =
    await enhanceEventsWithParticipationStatus(sessionUser, rawEvents);
  const events = rawEventsWithParticipationStatus.map((event) => {
    const { background, responsibleOrganizations, ...otherFields } = event;

    let backgroundImage;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        backgroundImage = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Event.Card.Background.width,
            height: ImageSizes.Event.Card.Background.height,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Event.Card.BlurredBackground.width,
            height: ImageSizes.Event.Card.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      }
    } else {
      backgroundImage = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }

    const enhancedResponsibleOrganizations = responsibleOrganizations.map(
      (relation) => {
        let logo = relation.organization.logo;
        let blurredLogo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL) {
            logo = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Organization.CardFooter.Logo.width,
                height: ImageSizes.Organization.CardFooter.Logo.height,
              },
            });
            blurredLogo = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Organization.CardFooter.BlurredLogo.width,
                height: ImageSizes.Organization.CardFooter.BlurredLogo.height,
              },
              blur: BlurFactor,
            });
          }
        }
        return {
          organization: { ...relation.organization, logo, blurredLogo },
        };
      }
    );

    return {
      background: backgroundImage,
      blurredBackground,
      responsibleOrganizations: enhancedResponsibleOrganizations,
      ...otherFields,
    };
  });

  const rawProjects = await getAllProjects({
    filter: submission.value.prjFilter,
    sortBy: submission.value.prjSortBy,
    search: submission.value.search,
    sessionUser,
    take: numberOfEntities,
    language,
  });

  const projects = rawProjects.map((project) => {
    const { logo, background, responsibleOrganizations, ...otherFields } =
      project;
    const extensions: {
      responsibleOrganizations: {
        organization: Pick<Organization, "name" | "slug" | "logo">;
      }[];
    } = { responsibleOrganizations: [] };

    let logoImage: string | null = null;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logoImage = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Project.Card.Logo.width,
            height: ImageSizes.Project.Card.Logo.height,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Project.Card.BlurredLogo.width,
            height: ImageSizes.Project.Card.BlurredLogo.height,
          },
          blur: BlurFactor,
        });
      }
    }

    let backgroundImage: string | null = null;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        backgroundImage = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Project.Card.Background.width,
            height: ImageSizes.Project.Card.Background.height,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Project.Card.BlurredBackground.width,
            height: ImageSizes.Project.Card.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      }
    } else {
      backgroundImage = DefaultImages.Project.Background;
      blurredBackground = DefaultImages.Project.BlurredBackground;
    }

    extensions.responsibleOrganizations = responsibleOrganizations.map(
      (relation) => {
        let logoImage: string | null = null;
        let blurredLogo;
        if (relation.organization.logo !== null) {
          const publicURL = getPublicURL(
            authClient,
            relation.organization.logo
          );
          if (publicURL !== null) {
            logoImage = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Organization.CardFooter.Logo.width,
                height: ImageSizes.Organization.CardFooter.Logo.height,
              },
            });
            blurredLogo = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Organization.CardFooter.BlurredLogo.width,
                height: ImageSizes.Organization.CardFooter.BlurredLogo.height,
              },
              blur: BlurFactor,
            });
          }
        }
        return {
          organization: {
            ...relation.organization,
            logo: logoImage,
            blurredLogo,
          },
        };
      }
    );
    return {
      ...otherFields,
      ...extensions,
      logo: logoImage,
      blurredLogo,
      background: backgroundImage,
      blurredBackground,
    };
  });

  const fundings = await getAllFundings({
    filter: submission.value.fndFilter,
    sortBy: submission.value.fndSortBy,
    search: submission.value.search,
    sessionUser,
    take: numberOfFundings,
    language,
  });

  return {
    profiles,
    organizations,
    events,
    projects,
    fundings,
    locales,
    language,
  };
};

function ExploreIndex() {
  const loaderData = useLoaderData<typeof loader>();

  const [searchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();

  return (
    <>
      {/* Profile Card Section */}
      {loaderData.profiles.length > 0 ? (
        <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
            <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7">
              {loaderData.locales.index.content.profiles}
            </div>
            <div className="mv-text-right">
              <LinkButton
                to={
                  searchParamsString === ""
                    ? "/explore/profiles"
                    : `/explore/profiles?${searchParams.toString()}`
                }
              >
                {loaderData.locales.index.links.profiles}
              </LinkButton>
            </div>
          </div>
          <div className="@xl:mv-px-2">
            <CardContainer>
              {loaderData.profiles.map((profile) => {
                return (
                  <ProfileCard
                    key={`newest-profile-card-${profile.username}`}
                    profile={profile}
                    locales={loaderData.locales.dashboard}
                  />
                );
              })}
            </CardContainer>
          </div>
        </section>
      ) : null}
      {/* Organization Card Section */}
      {loaderData.organizations.length > 0 ? (
        <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
            <h3 className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7">
              {loaderData.locales.index.content.organizations}
            </h3>
            <div className="mv-text-right">
              <LinkButton
                to={
                  searchParamsString === ""
                    ? "/explore/organizations"
                    : `/explore/organizations?${searchParams.toString()}`
                }
              >
                {loaderData.locales.index.links.organizations}
              </LinkButton>
            </div>
          </div>
          <div className="@xl:mv-px-2">
            <CardContainer>
              {loaderData.organizations.map((organization) => {
                return (
                  <OrganizationCard
                    key={`newest-organization-card-${organization.slug}`}
                    organization={organization}
                    locales={loaderData.locales.dashboard}
                  />
                );
              })}
            </CardContainer>
          </div>
        </section>
      ) : null}
      {/* Event Card Section */}
      {loaderData.events.length > 0 ? (
        <section className="mv-w-full mv-mb-8 mv-mx-auto @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
            <h3 className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7">
              {loaderData.locales.index.content.events}
            </h3>
            <div className="mv-text-right">
              <LinkButton
                to={
                  searchParamsString === ""
                    ? "/explore/events"
                    : `/explore/events?${searchParams.toString()}`
                }
              >
                {loaderData.locales.index.links.events}
              </LinkButton>
            </div>
          </div>
          <div className="@xl:mv-px-2">
            <CardContainer>
              {loaderData.events.map((event) => {
                const startTime = utcToZonedTime(
                  event.startTime,
                  "Europe/Berlin"
                );
                const endTime = utcToZonedTime(event.endTime, "Europe/Berlin");
                const participationUntil = utcToZonedTime(
                  event.participationUntil,
                  "Europe/Berlin"
                );
                return (
                  <EventCard
                    key={`newest-event-card-${event.slug}`}
                    locales={loaderData.locales.dashboard}
                    currentLanguage={loaderData.language}
                    event={{
                      ...event,
                      startTime,
                      endTime,
                      participationUntil,
                      responsibleOrganizations:
                        event.responsibleOrganizations.map(
                          (item) => item.organization
                        ),
                    }}
                  />
                );
              })}
            </CardContainer>
          </div>
        </section>
      ) : null}
      {/* Project Card Section */}
      {loaderData.projects.length > 0 ? (
        <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
            <h3 className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7">
              {loaderData.locales.index.content.projects}
            </h3>
            <div className="mv-text-right">
              <LinkButton
                to={
                  searchParamsString === ""
                    ? "/explore/projects"
                    : `/explore/projects?${searchParams.toString()}`
                }
              >
                {loaderData.locales.index.links.projects}
              </LinkButton>
            </div>
          </div>
          <div className="@xl:mv-px-2">
            <CardContainer>
              {loaderData.projects.map((project) => {
                return (
                  <ProjectCard
                    key={`newest-project-card-${project.slug}`}
                    project={project}
                    locales={loaderData.locales.dashboard}
                  />
                );
              })}
            </CardContainer>
          </div>
        </section>
      ) : null}
      {/* Funding Card Section */}
      {loaderData.fundings.length > 0 ? (
        <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
            <h3 className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7">
              {loaderData.locales.index.content.fundings}
            </h3>
            <div className="mv-text-right">
              <LinkButton
                to={
                  searchParamsString === ""
                    ? "/explore/fundings"
                    : `/explore/fundings?${searchParams.toString()}`
                }
              >
                {loaderData.locales.index.links.fundings}
              </LinkButton>
            </div>
          </div>
          <div className="  mv-px-4">
            <FundingCard.Container>
              {loaderData.fundings.map((funding) => {
                return (
                  <FundingCard
                    key={funding.url}
                    url={funding.url}
                    locales={loaderData.locales.fundings}
                  >
                    <FundingCard.Subtitle>
                      {funding.types
                        .map((relation) => {
                          return relation.type.title;
                        })
                        .join(", ")}
                    </FundingCard.Subtitle>
                    <FundingCard.Title>{funding.title}</FundingCard.Title>
                    <FundingCard.Category
                      items={funding.regions.map((relation) => {
                        return relation.area.name;
                      })}
                      locales={loaderData.locales.fundings}
                    >
                      <FundingCard.Category.Title>
                        {loaderData.locales.fundings.card.region}
                      </FundingCard.Category.Title>
                    </FundingCard.Category>
                    <FundingCard.Category
                      items={funding.sourceEntities}
                      locales={loaderData.locales.fundings}
                    >
                      <FundingCard.Category.Title>
                        {loaderData.locales.fundings.card.eligibleEntity}
                      </FundingCard.Category.Title>
                    </FundingCard.Category>

                    <FundingCard.Category
                      items={funding.sourceAreas}
                      locales={loaderData.locales.fundings}
                    >
                      <FundingCard.Category.Title>
                        {loaderData.locales.fundings.card.area}
                      </FundingCard.Category.Title>
                    </FundingCard.Category>
                  </FundingCard>
                );
              })}
            </FundingCard.Container>
          </div>
        </section>
      ) : null}
    </>
  );
}

function LinkButton(props: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={props.to}
      className="mv-appearance-none mv-font-semibold mv-text-center mv-rounded-lg mv-h-10 mv-text-sm mv-px-4 mv-py-2.5 mv-leading-5 mv-border mv-bg-neutral-50 mv-border-primary mv-text-primary hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
    >
      {props.children}
    </Link>
  );
}

export default ExploreIndex;
