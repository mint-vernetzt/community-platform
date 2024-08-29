import { parseWithZod } from "@conform-to/zod-v1";
import {
  Avatar,
  Button,
  CardContainer,
  EventCard,
  Link as MVLink,
  OrganizationCard,
  ProfileCard,
  ProjectCard,
} from "@mint-vernetzt/components";
import type { Organization, Profile } from "@prisma/client";
import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import i18next from "~/i18next.server";
import { GravityType, getImageURL } from "~/images.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { detectLanguage } from "~/root.server";
import { getPublicURL } from "~/storage.server";
import styles from "../../common/design/styles/styles.css";
import { TeaserCard, type TeaserIconType } from "./__dashboard.components";
import {
  enhanceEventsWithParticipationStatus,
  getEventsForCards,
  getHideUpdatesCookie,
  getOrganizationsForCards,
  getOrganizationsFromInvites,
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

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const profile = await getProfileById(sessionUser.id);
  if (profile === null) {
    throw json({ message: t("error.profileNotFound") }, { status: 404 });
  }

  const abilities = await getFeatureAbilities(authClient, [
    "add-to-organization",
    "my_organizations",
    "updates",
  ]);

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

  const organizationsFromInvites = await getOrganizationsFromInvites(
    authClient,
    sessionUser.id
  );

  const cookieHeader = request.headers.get("Cookie");
  const hideUpdatesCookie = getHideUpdatesCookie();
  const parsedHideUpdatesCookie = (await hideUpdatesCookie.parse(
    cookieHeader
  )) || { hideUpdates: "false" };

  return json({
    communityCounter,
    profiles,
    organizations,
    events,
    projects,
    firstName: profile.firstName,
    lastName: profile.lastName,
    username: profile.username,
    organizationsFromInvites,
    abilities,
    hideUpdates: parsedHideUpdatesCookie.hideUpdates,
  });
};

const hideUpdatesSchema = z.object({
  hideUpdates: z
    .string()
    .refine(
      (hideUpdates) => hideUpdates === "true" || hideUpdates === "false",
      {
        message: "Only true and false are valid hideUpdate values.",
      }
    ),
});

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: hideUpdatesSchema });
  if (submission.status !== "success") {
    return json(submission.reply());
  }

  const hideUpdatesCookie = getHideUpdatesCookie();

  return json(
    { hideUpdates: submission.value.hideUpdates },
    {
      headers: {
        "Set-Cookie": await hideUpdatesCookie.serialize(
          {
            hideUpdates: submission.value.hideUpdates,
          },
          {
            // TODO: Ask about expiry
            expires: new Date(Date.now() + 60_000),
            maxAge: 60,
          }
        ),
      },
    }
  );
};

function getDataForExternalLinkTeasers() {
  const teaserData: {
    website: { link: string; icon: TeaserIconType };
    dataLab: { link: string; icon: TeaserIconType };
    meshMint: { link: string; icon: TeaserIconType };
  } = {
    website: {
      link: "https://www.mint-vernetzt.de",
      icon: "globe",
    },
    dataLab: {
      link: "https://www.mint-vernetzt.de/mint-datalab/",
      icon: "bar-chart",
    },
    meshMint: {
      link: "https://www.mint-vernetzt.de/mesh-studie/?limit=6&PostType=mesh_study",
      icon: "signpost",
    },
  };
  return teaserData;
}

function getDataForUpdateTeasers() {
  const teaserData: {
    addYourselfToOrganizations: { link: string; icon: TeaserIconType };
    faq: { link: string; icon: TeaserIconType };
  } = {
    addYourselfToOrganizations: {
      link: "/my/organizations",
      icon: "Plus big",
    },
    faq: {
      link: "/help",
      icon: "search",
    },
  };
  return teaserData;
}

function Dashboard() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation(i18nNS);

  const externalLinkTeasers = getDataForExternalLinkTeasers();

  const updateTeasers = getDataForUpdateTeasers();
  const hideUpdatesFetcher = useFetcher();
  // Optimistic UI
  if (hideUpdatesFetcher.formData?.has("hideUpdates")) {
    const hideUpdates = hideUpdatesFetcher.formData.get("hideUpdates");
    if (hideUpdates !== null && typeof hideUpdates === "string") {
      if (
        actionData !== undefined &&
        "hideUpdates" in actionData &&
        (hideUpdates === "true" || hideUpdates === "false")
      ) {
        actionData.hideUpdates = hideUpdates;
      }
      loaderData.hideUpdates = hideUpdates;
    }
  }
  const hideUpdates =
    actionData && "hideUpdates" in actionData
      ? actionData.hideUpdates
      : loaderData.hideUpdates;

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-m-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
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
      {loaderData.abilities["add-to-organization"].hasAccess &&
        loaderData.abilities["my_organizations"].hasAccess &&
        loaderData.organizationsFromInvites.length > 0 && (
          <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
            <div className="mv-flex mv-flex-col @lg:mv-flex-row mv-gap-6 mv-p-6 mv-bg-primary-50 mv-rounded-lg mv-items-center">
              <div className="mv-flex mv-items-center mv-gap-2">
                <div className="mv-flex mv-pl-[46px] *:mv--ml-[46px]">
                  {loaderData.organizationsFromInvites
                    .slice(0, 3)
                    .map((organization) => {
                      return (
                        <div
                          key={organization.name}
                          className="mv-w-[73px] mv-h-[73px]"
                        >
                          <Avatar size="full" {...organization} />
                        </div>
                      );
                    })}
                </div>
                {loaderData.organizationsFromInvites.length > 3 && (
                  <div className="mv-text-2xl mv-font-semibold mv-text-primary">
                    +{loaderData.organizationsFromInvites.length - 3}
                  </div>
                )}
              </div>
              <div className="mv-flex-1 mv-text-primary">
                <h3 className="mv-font-bold mv-text-2xl mv-mb-2 mv-leading-[1.625rem] mv-text-center @lg:mv-max-w-fit">
                  {t("content.invites.headline", {
                    count: loaderData.organizationsFromInvites.length,
                  })}
                </h3>
                <p className="mv-text-normal mv-text-sm">
                  {t("content.invites.description")}
                </p>
              </div>
              <Button as="a" href="/my/organizations">
                {t("content.invites.linkDescription")}
              </Button>
            </div>
          </section>
        )}
      {loaderData.abilities["updates"].hasAccess ? (
        <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-w-full mv-flex mv-justify-between mv-gap-8 mv-mb-4 mv-items-end">
            <h2 className="mv-appearance-none mv-w-full mv-text-neutral-700 mv-text-2xl mv-leading-[26px] mv-font-semibold mv-shrink">
              {t("content.updates.headline")}
            </h2>
            <hideUpdatesFetcher.Form
              method="post"
              className="mv-text-nowrap mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline"
            >
              <input
                type="hidden"
                readOnly
                name="hideUpdates"
                defaultValue={hideUpdates === "true" ? "false" : "true"}
              />
              <button
                type="submit"
                className="mv-appearance-none mv-text-nowrap mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline"
              >
                {hideUpdates === "true"
                  ? t("content.updates.show")
                  : t("content.updates.hide")}
              </button>
            </hideUpdatesFetcher.Form>
          </div>
          {hideUpdates === "true" ? null : (
            <ul className="mv-flex mv-flex-col @xl:mv-grid @xl:mv-grid-cols-2 @xl:mv-grid-rows-1 mv-gap-4 @xl:mv-gap-6 mv-w-full">
              {Object.entries(updateTeasers).map(([key, value]) => {
                return (
                  <TeaserCard
                    key={key}
                    to={value.link}
                    headline={t(`content.updates.${key}.headline`)}
                    description={t(`content.updates.${key}.description`)}
                    linkDescription={t(
                      `content.updates.${key}.linkDescription`
                    )}
                    iconType={value.icon}
                  />
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
      <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-flex mv-flex-col mv-w-full mv-items-center mv-gap-6 mv-py-6 mv-bg-white mv-border mv-border-neutral-200 mv-rounded-lg">
          <h2 className="mv-appearance-none mv-w-full mv-text-primary mv-text-center mv-text-3xl mv-font-semibold mv-leading-7 @lg:mv-leading-8 mv-px-11 @lg:mv-px-6">
            {t("content.communityCounter.headline")}
          </h2>
          <ul className="mv-grid mv-grid-cols-2 mv-grid-rows-2 mv-place-items-center mv-w-fit mv-gap-x-6 mv-gap-y-8 mv-px-6 @lg:mv-gap-x-16 @lg:mv-grid-cols-4 @lg:mv-grid-rows-1">
            {Object.entries(loaderData.communityCounter).map(([key, value]) => {
              return (
                <li
                  key={key}
                  className="mv-grid mv-grid-cols-1 mv-grid-rows-2 mv-place-items-center mv-gap-2"
                >
                  <div className="mv-text-5xl mv-font-bold mv-leading-10 mv-text-primary">
                    {value}
                  </div>
                  <div className="mv-text-lg mv-font-bold mv-leading-6 mv-text-primary">
                    {t(`content.communityCounter.${key}`)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
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
      <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
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
      <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
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
      <section className="mv-w-full mv-mb-12 mv-mx-auto @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
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
      <section className="mv-w-full mv-mb-24 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <h2 className="mv-appearance-none mv-w-full mv-mb-6 mv-text-neutral-700 mv-text-2xl mv-leading-[26px] mv-font-semibold">
          {t("content.externalLinks.headline")}
        </h2>
        <ul className="mv-flex mv-flex-col @xl:mv-grid @xl:mv-grid-cols-3 @xl:mv-grid-rows-1 mv-gap-6 @xl:mv-gap-8 mv-w-full">
          {Object.entries(externalLinkTeasers).map(([key, value]) => {
            return (
              <TeaserCard
                to={value.link}
                key={key}
                headline={t(`content.externalLinks.${key}.headline`)}
                description={t(`content.externalLinks.${key}.description`)}
                linkDescription={t(
                  `content.externalLinks.${key}.linkDescription`
                )}
                iconType={value.icon}
                external
              />
            );
          })}
        </ul>
      </section>
    </>
  );
}

export default Dashboard;
