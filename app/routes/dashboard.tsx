import {
  Button,
  CardContainer,
  EventCard,
  Link as MVLink,
  OrganizationCard,
  ProfileCard,
  ProjectCard,
} from "@mint-vernetzt/components";
import type { Organization, Profile } from "@prisma/client";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
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

function getExternalLinks() {
  return {
    website: {
      link: "https://www.mint-vernetzt.de",
      icon: (
        <svg
          width="39"
          height="40"
          viewBox="0 0 39 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.711678 20C0.711678 9.23045 9.1235 0.5 19.5 0.5C29.8765 0.5 38.2883 9.23045 38.2883 20C38.2883 30.7696 29.8765 39.5 19.5 39.5C9.1235 39.5 0.711678 30.7696 0.711678 20ZM18.3257 3.1241C16.7535 3.62312 15.1895 5.12448 13.8934 7.64672C13.4877 8.43637 13.119 9.30822 12.7949 10.25H18.3257V3.1241ZM10.3161 10.25C10.7352 8.88838 11.2408 7.62916 11.8212 6.49966C12.2409 5.68286 12.7095 4.91775 13.223 4.22535C10.2965 5.48112 7.79555 7.58856 6.0069 10.25H10.3161ZM8.95142 18.7812C9.02126 16.644 9.27374 14.5929 9.68312 12.6875H4.64226C3.78668 14.5567 3.24893 16.6131 3.1015 18.7812H8.95142ZM12.0947 12.6875C11.656 14.5521 11.3776 16.6065 11.3014 18.7812H18.3257V12.6875H12.0947ZM20.6743 12.6875V18.7812H27.6986C27.6224 16.6065 27.344 14.5521 26.9053 12.6875H20.6743ZM11.3014 21.2187C11.3776 23.3935 11.656 25.4479 12.0947 27.3125H18.3257V21.2187H11.3014ZM20.6743 21.2187V27.3125H26.9053C27.344 25.4479 27.6224 23.3935 27.6986 21.2187H20.6743ZM12.7949 29.75C13.119 30.6918 13.4877 31.5636 13.8934 32.3533C15.1895 34.8755 16.7535 36.3769 18.3257 36.8759V29.75H12.7949ZM13.223 35.7746C12.7095 35.0822 12.2409 34.3171 11.8212 33.5003C11.2408 32.3708 10.7352 31.1116 10.3161 29.75H6.0069C7.79555 32.4114 10.2965 34.5189 13.223 35.7746ZM9.68312 27.3125C9.27374 25.4071 9.02126 23.356 8.95142 21.2187H3.1015C3.24893 23.3869 3.78668 25.4432 4.64226 27.3125H9.68312ZM25.777 35.7746C28.7035 34.5189 31.2044 32.4114 32.9931 29.75H28.6838C28.2648 31.1116 27.7592 32.3708 27.1788 33.5003C26.7591 34.3171 26.2905 35.0822 25.777 35.7746ZM20.6743 29.75V36.8759C22.2464 36.3769 23.8104 34.8755 25.1065 32.3533C25.5123 31.5636 25.881 30.6918 26.2051 29.75H20.6743ZM29.3169 27.3125H34.3577C35.2133 25.4432 35.751 23.3869 35.8985 21.2187H30.0486C29.9787 23.356 29.7262 25.4071 29.3169 27.3125ZM35.8985 18.7812C35.751 16.6131 35.2133 14.5567 34.3577 12.6875H29.3169C29.7262 14.5929 29.9787 16.644 30.0486 18.7812H35.8985ZM27.1788 6.49966C27.7592 7.62916 28.2648 8.88838 28.6838 10.25H32.9931C31.2044 7.58855 28.7035 5.48112 25.777 4.22535C26.2905 4.91775 26.7591 5.68286 27.1788 6.49966ZM26.2051 10.25C25.881 9.30822 25.5123 8.43637 25.1065 7.64672C23.8104 5.12448 22.2464 3.62312 20.6743 3.1241V10.25H26.2051Z"
            fill="white"
          />
        </svg>
      ),
    },
    dataLab: {
      link: "https://www.mint-vernetzt.de/mint-datalab/",
      icon: (
        <svg
          width="39"
          height="39"
          viewBox="0 0 39 39"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.1058 26.8125H5.40876V34.125H10.1058V26.8125ZM21.8485 17.0625H17.1515V34.125H21.8485V17.0625ZM33.5912 4.875V34.125H28.8942V4.875L33.5912 4.875ZM28.8942 2.4375C27.5971 2.4375 26.5456 3.52881 26.5456 4.875V34.125C26.5456 35.4712 27.5971 36.5625 28.8942 36.5625H33.5912C34.8883 36.5625 35.9398 35.4712 35.9398 34.125V4.875C35.9398 3.52881 34.8883 2.4375 33.5912 2.4375H28.8942ZM14.8029 17.0625C14.8029 15.7163 15.8544 14.625 17.1515 14.625H21.8485C23.1456 14.625 24.1971 15.7163 24.1971 17.0625V34.125C24.1971 35.4712 23.1456 36.5625 21.8485 36.5625H17.1515C15.8544 36.5625 14.8029 35.4712 14.8029 34.125V17.0625ZM3.06022 26.8125C3.06022 25.4663 4.1117 24.375 5.40876 24.375H10.1058C11.4029 24.375 12.4544 25.4663 12.4544 26.8125V34.125C12.4544 35.4712 11.4029 36.5625 10.1058 36.5625H5.40876C4.1117 36.5625 3.06022 35.4712 3.06022 34.125V26.8125Z"
            fill="white"
          />
        </svg>
      ),
    },
    meshMint: {
      link: "https://www.meshmint.org/",
      icon: (
        <svg
          width="85"
          height="77"
          viewBox="0 0 85 77"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M39.356 19.2085V25.9893H26.2444C24.7961 25.9893 23.6221 27.1633 23.6221 28.6116V39.1009C23.6221 40.5492 24.7961 41.7232 26.2444 41.7232H39.356V57.4571H44.6007V41.7232H53.8617C54.64 41.7232 55.378 41.3775 55.8762 40.7797L60.9463 34.6956C61.3515 34.2094 61.3515 33.5031 60.9463 33.0169L55.8762 26.9328C55.378 26.335 54.64 25.9893 53.8617 25.9893H44.6007V19.2085C44.6007 18.513 44.3244 17.846 43.8326 17.3542C42.8085 16.3302 41.1481 16.3302 40.1241 17.3542C39.6323 17.846 39.356 18.513 39.356 19.2085ZM53.8617 28.6116L58.2323 33.8562L53.8617 39.1009H26.2444L26.2444 28.6116H53.8617Z"
            fill="white"
          />
        </svg>
      ),
    },
  };
}

function Dashboard() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNS);
  const externalLinks = getExternalLinks();

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
            <MVLink to="/explore/profiles">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {t("content.allProfiles")}
              </span>
            </MVLink>
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
            <MVLink to="/explore/organizations">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {t("content.allOrganizations")}
              </span>
            </MVLink>
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
            <MVLink to="/explore/projects">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {t("content.allProjects")}
              </span>
            </MVLink>
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
      <section className="mv-w-full mv-mb-12 mv-mx-auto @md:mv-max-w-screen-md @lg:mv-max-w-screen-lg @xl:mv-max-w-screen-xl @2xl:mv-max-w-screen-2xl">
        <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 @lg:mv-text-5xl @lg:mv-leading-9">
            {t("content.events")}
          </div>
          <div className="mv-text-right">
            <MVLink to="/explore/events">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {t("content.allEvents")}
              </span>
            </MVLink>
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
      <section className="mv-w-full mv-mb-16 @xl:mv-mb-20 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-md @lg:mv-max-w-screen-lg @xl:mv-max-w-screen-xl @2xl:mv-max-w-screen-2xl">
        <h2 className="mv-appearance-none mv-w-full mv-mb-6 mv-text-neutral-700 mv-text-2xl mv-leading-[26px] mv-font-semibold mv-tracking-[-0.44px]">
          {t("content.externalLinks.headline")}
        </h2>
        <ul className="mv-flex mv-flex-col @xl:mv-grid @xl:mv-grid-cols-3 @xl:mv-grid-rows-1 mv-gap-6 @xl:mv-gap-8 mv-w-full">
          {Object.entries(externalLinks).map(([key, value]) => {
            return (
              <li key={key}>
                <Link
                  to={value.link}
                  target="_blank"
                  className="mv-flex mv-gap-2 mv-items-center mv-rounded-lg mv-bg-neutral-50 mv-border mv-border-neutral-200 mv-px-4 mv-py-2 hover:mv-no-underline @xl:mv-h-full"
                >
                  <div className="mv-flex mv-flex-col mv-gap-2 mv-py-2 mv-flex-grow @xl:mv-h-full">
                    <h3 className="mv-appearance-none mv-text-neutral-700 mv-text-xs mv-font-bold mv-leading-[15.6px] mv-tracking-[-0.24px]">
                      {t(`content.externalLinks.${key}.headline`)}
                    </h3>
                    <div className="mv-text-primary mv-text-2xl mv-font-semibold mv-leading-[26px] mv-tracking-[-0.44px] @xl:mv-flex-grow">
                      {t(`content.externalLinks.${key}.description`)}
                    </div>
                    <div className="mv-flex mv-items-center mv-gap-1 mv-text-primary mv-text-sm mv-font-semibold mv-leading-5 mv-tracking-[0.14px] mv-underline mv-underline-offset-1">
                      {t(`content.externalLinks.${key}.linkDescription`)}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        className="w-4 h-4"
                      >
                        <path
                          fill="currentColor"
                          fillRule="evenodd"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth=".3"
                          d="M7.477 3.625a.375.375 0 0 0-.375-.375H2.125C1.504 3.25 1 3.754 1 4.375v7.5C1 12.496 1.504 13 2.125 13h7.5c.621 0 1.125-.504 1.125-1.125V6.898a.375.375 0 0 0-.75 0v4.977a.375.375 0 0 1-.375.375h-7.5a.375.375 0 0 1-.375-.375v-7.5c0-.207.168-.375.375-.375h4.977a.375.375 0 0 0 .375-.375Z"
                          clipRule="evenodd"
                        />
                        <path
                          fill="currentColor"
                          fillRule="evenodd"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth=".3"
                          d="M13 1.375A.375.375 0 0 0 12.625 1h-3.75a.375.375 0 1 0 0 .75h2.845L5.61 7.86a.375.375 0 0 0 .53.53l6.11-6.11v2.845a.375.375 0 0 0 .75 0v-3.75Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-h-[76px] mv-w-[85px] mv-min-h-[76px] mv-min-w-[85px] mv-flex-shrink mv-bg-primary-200 mv-rounded-lg">
                    {value.icon}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

export default Dashboard;
