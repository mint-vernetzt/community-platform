import {
  Button,
  CardContainer,
  EventCard,
  Link,
  OrganizationCard,
  ProfileCard,
  ProjectCard,
} from "@mint-vernetzt/components";
import type { Organization, Profile } from "@prisma/client";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { GravityType, getImageURL } from "~/images.server";
import { detectLanguage } from "~/root.server";
import { getPublicURL } from "~/storage.server";
import styles from "../../common/design/styles/styles.css";
import {
  enhanceEventsWithParticipationStatus,
  getEventsForCards,
  getOrganizationsForCards,
  getProfileById,
  getProfilesForCards,
  getProjectsForCards,
} from "./dashboard.server";
import {
  getEventCount,
  getOrganizationCount,
  getProfileCount,
  getProjectCount,
} from "./utils.server";

const i18nNS = ["routes/dashboard"];
export const handle = {
  i18n: i18nNS,
};

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirect("/login");
  }

  const profile = await getProfileById(sessionUser.id);
  if (profile === null) {
    throw json({ message: t("error.profileNotFound") }, { status: 404 });
  }

  if (profile.termsAccepted === false) {
    return redirect("/accept-terms?redirect_to=/dashboard");
  }

  const numberOfProfiles = 4;
  const profileTake = numberOfProfiles;
  const rawProfiles = await getProfilesForCards(profileTake);

  const profiles = rawProfiles.map((profile) => {
    const { avatar, background, memberOf, ...otherFields } = profile;
    const extensions: {
      memberOf: Pick<Organization, "name" | "slug" | "logo">[];
      areas: string[];
      offers: string[];
    } = { memberOf: [], areas: [], offers: [] };

    let avatarImage: string | null = null;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatarImage = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
        });
      }
    }

    let backgroundImage: string | null = null;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        backgroundImage = getImageURL(publicURL, {
          resize: { type: "fill", width: 348, height: 160 },
        });
      }
    }

    extensions.memberOf = memberOf.map((relation, index) => {
      let logoImage: string | null = null;
      if (relation.organization.logo !== null) {
        const publicURL = getPublicURL(authClient, relation.organization.logo);
        if (publicURL !== null) {
          logoImage = getImageURL(publicURL, {
            resize: { type: "fill", width: 36, height: 36 },
          });
        }
      }
      return { ...relation.organization, logo: logoImage };
    });

    extensions.areas = profile.areas.map((relation) => {
      return relation.area.name;
    });

    extensions.offers = profile.offers.map((relation) => {
      return relation.offer.title;
    });

    return {
      ...otherFields,
      ...extensions,
      avatar: avatarImage,
      background: backgroundImage,
    };
  });
  const numberOfOrganizations = 4;
  const organizationTake = numberOfOrganizations;
  const rawOrganizations = await getOrganizationsForCards(organizationTake);

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
    } = { teamMembers: [], focuses: [], areas: [], types: [] };

    let logoImage: string | null = null;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logoImage = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
        });
      }
    }

    let backgroundImage: string | null = null;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        backgroundImage = getImageURL(publicURL, {
          resize: { type: "fill", width: 348, height: 160 },
        });
      }
    }

    extensions.teamMembers = teamMembers.map((relation, index) => {
      let avatar: string | null = null;
      if (relation.profile.avatar !== null) {
        const publicURL = getPublicURL(authClient, relation.profile.avatar);
        if (publicURL !== null) {
          avatar = getImageURL(publicURL, {
            resize: { type: "fill", width: 36, height: 36 },
          });
        }
      }
      return { ...relation.profile, avatar: avatar };
    });

    extensions.areas = organization.areas.map((relation) => {
      return relation.area.name;
    });

    extensions.focuses = organization.focuses.map((relation) => {
      return relation.focus.title;
    });

    extensions.types = organization.types.map((relation) => {
      return relation.organizationType.title;
    });
    return {
      ...otherFields,
      ...extensions,
      logo: logoImage,
      background: backgroundImage,
    };
  });

  const numberOfProjects = 4;
  const rawProjects = await getProjectsForCards(numberOfProjects);
  const projects = rawProjects.map((project) => {
    const { logo, background, responsibleOrganizations, ...otherFields } =
      project;
    const extensions: {
      responsibleOrganizations: {
        organization: Pick<Organization, "name" | "slug" | "logo">;
      }[];
    } = { responsibleOrganizations: [] };

    let logoImage: string | null = null;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logoImage = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
        });
      }
    }

    let backgroundImage: string | null = null;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        backgroundImage = getImageURL(publicURL, {
          resize: { type: "fill", width: 348, height: 160 },
        });
      }
    }

    extensions.responsibleOrganizations = responsibleOrganizations.map(
      (relation) => {
        let logoImage: string | null = null;
        if (relation.organization.logo !== null) {
          const publicURL = getPublicURL(
            authClient,
            relation.organization.logo
          );
          if (publicURL !== null) {
            logoImage = getImageURL(publicURL, {
              resize: { type: "fill", width: 36, height: 36 },
            });
          }
        }
        return { organization: { ...relation.organization, logo: logoImage } };
      }
    );
    return {
      ...otherFields,
      ...extensions,
      logo: logoImage,
      background: backgroundImage,
    };
  });

  const numberOfEvents = 4;
  const rawEvents = await getEventsForCards(numberOfEvents);

  const enhancedEventsWithParticipationStatus =
    await enhanceEventsWithParticipationStatus(sessionUser, rawEvents);

  const events = enhancedEventsWithParticipationStatus.map((event) => {
    const { background, responsibleOrganizations, ...otherFields } = event;

    let backgroundImage;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        backgroundImage = getImageURL(publicURL, {
          resize: { type: "fill", width: 348, height: 160 },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: { type: "fill", width: 18, height: 12 },
          blur: 5,
        });
      }
    } else {
      backgroundImage = "/images/default-event-background.jpg";
      blurredBackground = "/images/default-event-background-blurred.jpg";
    }

    const enhancedResponsibleOrganizations = responsibleOrganizations.map(
      (relation) => {
        let logo = relation.organization.logo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL) {
            logo = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        return { organization: { ...relation.organization, logo } };
      }
    );

    return {
      background: backgroundImage,
      blurredBackground,
      responsibleOrganizations: enhancedResponsibleOrganizations,
      ...otherFields,
    };
  });

  const communityCounter = {
    profiles: await getProfileCount(),
    organizations: await getOrganizationCount(),
    events: await getEventCount(),
    projects: await getProjectCount(),
  };

  return json({
    communityCounter,
    profiles,
    organizations,
    events,
    projects,
    firstName: profile.firstName,
    lastName: profile.lastName,
    username: profile.username,
  });
};

function Dashboard() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNS);

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-md @lg:mv-max-w-screen-lg @xl:mv-max-w-screen-xl @2xl:mv-max-w-screen-2xl">
        <div className="mv-px-4 @xl:mv-px-6">
          <h1 className="mv-text-primary mv-font-black mv-text-5xl @lg:mv-text-7xl mv-leading-tight mv-mb-2">
            {t("content.welcome")}
            <br />
            {loaderData.firstName} {loaderData.lastName}
          </h1>
          <p className="mv-font-semibold mv-mb-6">{t("content.community")}</p>
          <p>
            <Button
              variant="outline"
              as="a"
              href={`/profile/${loaderData.username}`}
            >
              {t("content.myProfile")}
            </Button>
          </p>
        </div>
      </section>
      <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-md @lg:mv-max-w-screen-lg @xl:mv-max-w-screen-xl @2xl:mv-max-w-screen-2xl">
        <div className="mv-flex mv-flex-col mv-w-full mv-items-center mv-gap-6 mv-py-6 mv-bg-gray-50 mv-border mv-border-neutral-200 mv-rounded-lg">
          <h2 className="mv-appearance-none mv-w-full mv-text-primary mv-text-center mv-text-3xl mv-font-semibold mv-leading-7 @lg:mv-leading-8 mv-tracking-tight mv-px-11 @lg:mv-px-6">
            {t("content.communityCounter.headline")}
          </h2>
          <ul className="mv-grid mv-grid-cols-2 mv-grid-rows-2 mv-place-items-center mv-w-fit mv-gap-x-6 mv-gap-y-8 mv-px-6 @lg:mv-gap-x-16 @lg:mv-grid-cols-4 @lg:mv-grid-rows-1">
            {Object.entries(loaderData.communityCounter).map(([key, value]) => {
              return (
                <li
                  key={key}
                  className="mv-grid mv-grid-cols-1 mv-grid-rows-2 mv-place-items-center mv-gap-2"
                >
                  <div className="mv-text-5xl mv-font-bold mv-leading-10 mv-tracking-tighter mv-text-primary">
                    {value}
                  </div>
                  <div className="mv-text-lg mv-font-bold mv-leading-6 mv-tracking-tight mv-text-primary">
                    {t(`content.communityCounter.${key}`)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-md @lg:mv-max-w-screen-lg @xl:mv-max-w-screen-xl @2xl:mv-max-w-screen-2xl">
        {/* <section className="mv-w-full mv-mx-auto mv-mb-8 mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1120px]"> */}
        {/* <section className="mv-w-full mv-mx-auto mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1024px] @xl:mv-max-w-[1280px] @2xl:mv-max-w-[1563px] mv-mb-16"> */}
        <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 @lg:mv-text-5xl @lg:mv-leading-9">
            {t("content.profiles")}
          </div>
          <div className="mv-text-right">
            <Link to="/explore/profiles">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {t("content.allProfiles")}
              </span>
            </Link>
          </div>
        </div>
        <div className="@xl:mv-px-2">
          <CardContainer>
            {loaderData.profiles.map((profile) => {
              return <ProfileCard key={profile.username} profile={profile} />;
            })}
          </CardContainer>
        </div>
      </section>
      <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-md @lg:mv-max-w-screen-lg @xl:mv-max-w-screen-xl @2xl:mv-max-w-screen-2xl">
        <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 @lg:mv-text-5xl @lg:mv-leading-9">
            {t("content.organizations")}
          </div>
          <div className="mv-text-right">
            <Link to="/explore/organizations">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {t("content.allOrganizations")}
              </span>
            </Link>
          </div>
        </div>
        <div className="@xl:mv-px-2">
          <CardContainer>
            {loaderData.organizations.map((organization) => {
              return (
                <OrganizationCard
                  key={organization.slug}
                  organization={organization}
                />
              );
            })}
          </CardContainer>
        </div>
      </section>
      <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-md @lg:mv-max-w-screen-lg @xl:mv-max-w-screen-xl @2xl:mv-max-w-screen-2xl">
        <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 @lg:mv-text-5xl @lg:mv-leading-9">
            {t("content.projects")}
          </div>
          <div className="mv-text-right">
            <Link to="/explore/projects">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {t("content.allProjects")}
              </span>
            </Link>
          </div>
        </div>
        <div className="@xl:mv-px-2">
          <CardContainer>
            {loaderData.projects.map((project) => {
              return <ProjectCard key={project.slug} project={project} />;
            })}
          </CardContainer>
        </div>
      </section>
      <section className="mv-w-full mv-mx-auto @md:mv-max-w-screen-md @lg:mv-max-w-screen-lg @xl:mv-max-w-screen-xl @2xl:mv-max-w-screen-2xl">
        <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 @lg:mv-text-5xl @lg:mv-leading-9">
            {t("content.events")}
          </div>
          <div className="mv-text-right">
            <Link to="/explore/events">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {t("content.allEvents")}
              </span>
            </Link>
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
                  key={event.slug}
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
    </>
  );
}

export default Dashboard;
