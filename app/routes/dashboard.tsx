import { Link as MVLink } from "@mint-vernetzt/components/src/molecules/Link";
import type { Organization, Profile } from "@prisma/client";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import Cookies from "js-cookie";
import React from "react";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import {
  BlurFactor,
  DefaultImages,
  ImageSizes,
  getImageURL,
} from "~/images.server";
import { detectLanguage } from "~/root.server";
import { getPublicURL } from "~/storage.server";
import styles from "../../common/design/styles/styles.css?url";
import { Icon } from "~/components-next/icons/Icon";
import { TeaserCard, type TeaserIconType } from "~/components-next/TeaserCard";
import {
  enhanceEventsWithParticipationStatus,
  getEventsForCards,
  getOrganizationsForCards,
  getOrganizationsFromInvites,
  getProfileById,
  getProfilesForCards,
  getProfilesFromRequests,
  getProjectsForCards,
  getUpcomingCanceledEvents,
} from "./dashboard.server";
import {
  getEventCount,
  getOrganizationCount,
  getProfileCount,
  getProjectCount,
} from "./utils.server";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { ProfileCard } from "@mint-vernetzt/components/src/organisms/cards/ProfileCard";
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
import { EventCard } from "@mint-vernetzt/components/src/organisms/cards/EventCard";
import { ProjectCard } from "@mint-vernetzt/components/src/organisms/cards/ProjectCard";
import { languageModuleMap } from "~/locales/.server";
import { decideBetweenSingularOrPlural } from "~/lib/utils/i18n";
import { type AtLeastOne } from "~/lib/utils/types";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["dashboard"];

  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const profile = await getProfileById(sessionUser.id);
  if (profile === null) {
    throw json({ message: locales.error.profileNotFound }, { status: 404 });
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
    return {
      ...otherFields,
      ...extensions,
      logo: logoImage,
      blurredLogo,
      background: backgroundImage,
      blurredBackground,
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

  const profilesFromRequests = await getProfilesFromRequests(
    authClient,
    sessionUser.id
  );

  const upcomingCanceledEvents = await getUpcomingCanceledEvents(
    authClient,
    sessionUser
  );

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
    profilesFromRequests,
    upcomingCanceledEvents,
    locales,
    language,
  });
};

function getDataForExternalTeasers() {
  type ExternalTeaserKey = keyof Awaited<
    ReturnType<typeof useLoaderData<typeof loader>>
  >["locales"]["content"]["externalTeasers"]["entries"];
  type ExternalTeaser = {
    [key in ExternalTeaserKey]: {
      link: string;
      icon: TeaserIconType;
      external: boolean;
    };
  };
  const teaserData: AtLeastOne<ExternalTeaser> = {
    website: {
      link: "https://www.mint-vernetzt.de",
      icon: "globe",
      external: true,
    },
    dataLab: {
      link: "https://www.mint-vernetzt.de/mint-datalab/",
      icon: "bar-chart",
      external: true,
    },
    meshMint: {
      link: "https://www.mint-vernetzt.de/mesh-studie/?limit=6&PostType=mesh_study",
      icon: "signpost",
      external: true,
    },
  };
  return teaserData;
}

function getDataForUpdateTeasers() {
  type UpdateTeaserKey = keyof Awaited<
    ReturnType<typeof useLoaderData<typeof loader>>
  >["locales"]["content"]["updateTeasers"]["entries"];
  type UpdateTeaser = {
    [key in UpdateTeaserKey]: {
      link: string;
      icon: TeaserIconType;
      external: boolean;
    };
  };
  const teaserData: AtLeastOne<UpdateTeaser> = {
    crawler: {
      link: "/explore/fundings",
      icon: "piggy-bank",
      external: false,
    },
    mediaDatabase: {
      link: "https://mediendatenbank.mint-vernetzt.de",
      icon: "Plus big",
      external: true,
    },
  };
  return teaserData;
}

function getDataForNewsTeasers() {
  type NewsTeaserKey = keyof Awaited<
    ReturnType<typeof useLoaderData<typeof loader>>
  >["locales"]["content"]["newsTeaser"]["entries"];
  type NewsTeaser = {
    [key in NewsTeaserKey]: {
      link: string;
      icon: TeaserIconType;
      external: boolean;
    };
  };
  const teaserData: AtLeastOne<NewsTeaser> = {
    tableMedia: {
      link: "https://table.media/aktion/mint-vernetzt?utm_source=samail&utm_medium=email&utm_campaign=rt_mintvernetzt_koop_email_job&utm_content=lp_1",
      icon: "lightning-charge",
      external: true,
    },
    annualConference: {
      link: "/event/mintvernetztjahrestagung2025-lxa5gke3",
      icon: "megaphone",
      external: false,
    },
  };
  return teaserData;
}

function Dashboard() {
  const loaderData = useLoaderData<typeof loader>();

  const externalTeasers = getDataForExternalTeasers();
  const updateTeasers = getDataForUpdateTeasers();
  const newsTeasers = getDataForNewsTeasers();

  const [hideUpdates, setHideUpdates] = React.useState(false);
  const [hideNews, setHideNews] = React.useState(false);
  const [hideNotifications, setHideNotifications] = React.useState(false);

  React.useEffect(() => {
    const hideUpdatesCookie = Cookies.get("mv-hide-updates");
    if (hideUpdatesCookie === "true") {
      setHideUpdates(true);
    }
    const hideNewsCookie = Cookies.get("mv-hide-news");
    if (hideNewsCookie === "true") {
      setHideNews(true);
    }
    const hideNotificationsCookie = Cookies.get("mv-hide-notifications");
    if (hideNotificationsCookie === "true") {
      setHideNotifications(true);
    }
  }, []);

  return (
    <>
      {/* Welcome Section */}
      <section className="mv-w-full mv-mx-auto mv-m-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-px-4 @xl:mv-px-6">
          <h1 className="mv-text-primary mv-font-black mv-text-5xl @lg:mv-text-7xl mv-leading-tight mv-mb-2">
            {loaderData.locales.content.welcome}
            <br />
            {loaderData.firstName} {loaderData.lastName}
          </h1>
          <p className="mv-font-semibold mv-mb-6">
            {loaderData.locales.content.community}
          </p>
          <Button
            variant="outline"
            as="a"
            href={`/profile/${loaderData.username}`}
          >
            {loaderData.locales.content.myProfile}
          </Button>
        </div>
      </section>
      {/* Organization Invites Section */}
      {loaderData.organizationsFromInvites.length > 0 && (
        <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-flex-col @lg:mv-flex-row mv-gap-6 mv-p-6 mv-bg-primary-50 mv-rounded-lg mv-items-center">
            <div className="mv-flex mv-items-center mv-gap-2">
              <div className="mv-flex mv-pl-[46px] *:mv--ml-[46px]">
                {loaderData.organizationsFromInvites
                  .slice(0, 3)
                  .map((organization, index) => {
                    return (
                      <div
                        key={`organization-invite-${organization.slug}-${index}`}
                        className="mv-w-[72px] mv-h-[72px]"
                      >
                        <Avatar
                          to={`/organization/${organization.slug}`}
                          size="full"
                          {...organization}
                        />
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
                {decideBetweenSingularOrPlural(
                  loaderData.locales.content.invites.headline_one,
                  loaderData.locales.content.invites.headline_other,
                  loaderData.organizationsFromInvites.length
                )}
              </h3>
              <p className="mv-text-normal mv-text-sm">
                {loaderData.locales.content.invites.description}
              </p>
            </div>
            <Button as="a" href="/my/organizations">
              {loaderData.locales.content.invites.linkDescription}
            </Button>
          </div>
        </section>
      )}
      {/* Organization Requests Section */}
      {loaderData.profilesFromRequests.length > 0 && (
        <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-flex-col @lg:mv-flex-row mv-gap-6 mv-p-6 mv-bg-primary-50 mv-rounded-lg mv-items-center">
            <div className="mv-flex mv-items-center mv-gap-2">
              <div className="mv-flex mv-pl-[46px] *:mv--ml-[46px]">
                {loaderData.profilesFromRequests
                  .slice(0, 3)
                  .map((profile, index) => {
                    return (
                      <div
                        key={`organization-request-${profile.username}-${index}`}
                        className="mv-w-[72px] mv-h-[72px]"
                      >
                        <Avatar
                          to={`/profile/${profile.username}`}
                          size="full"
                          {...profile}
                        />
                      </div>
                    );
                  })}
              </div>
              {loaderData.profilesFromRequests.length > 3 && (
                <div className="mv-text-2xl mv-font-semibold mv-text-primary">
                  +{loaderData.profilesFromRequests.length - 3}
                </div>
              )}
            </div>
            <div className="mv-flex-1 mv-text-primary">
              <h3 className="mv-font-bold mv-text-2xl mv-mb-2 mv-leading-[1.625rem] mv-text-center @lg:mv-max-w-fit">
                {decideBetweenSingularOrPlural(
                  loaderData.locales.content.requests.headline_one,
                  loaderData.locales.content.requests.headline_other,
                  loaderData.profilesFromRequests.length
                )}
              </h3>
              <p className="mv-text-normal mv-text-sm">
                {loaderData.locales.content.invites.description}
              </p>
            </div>
            <Button as="a" href="/my/organizations">
              {loaderData.locales.content.invites.linkDescription}
            </Button>
          </div>
        </section>
      )}
      {/* Notifications Section */}
      {loaderData.upcomingCanceledEvents.length > 0 ? (
        <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-w-full mv-flex mv-justify-between mv-gap-8 mv-mb-4 mv-items-end mv-group">
            <h2 className="mv-appearance-none mv-w-full mv-text-neutral-700 mv-text-2xl mv-leading-[26px] mv-font-semibold mv-shrink">
              {loaderData.locales.content.notifications.headline}
            </h2>
            <div className="mv-text-nowrap mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline">
              <label
                htmlFor="hide-notifications"
                className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline mv-hidden group-has-[:checked]:mv-inline"
              >
                {loaderData.locales.content.notifications.show}
              </label>
              <label
                htmlFor="hide-notifications"
                className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline group-has-[:checked]:mv-hidden"
              >
                {loaderData.locales.content.notifications.hide}
              </label>
              <input
                id="hide-notifications"
                type="checkbox"
                onChange={() => {
                  const hideNotifications =
                    Cookies.get("mv-hide-notifications") === "true"
                      ? false
                      : true;
                  Cookies.set(
                    "mv-hide-notifications",
                    hideNotifications.toString(),
                    {
                      sameSite: "strict",
                    }
                  );
                  setHideNotifications(hideNotifications);
                }}
                checked={hideNotifications === true}
                className="mv-w-0 mv-h-0 mv-opacity-0"
              />
            </div>
          </div>
          {hideNotifications === false ? (
            <ul className="mv-flex mv-flex-col mv-gap-4 @xl:mv-gap-6 mv-w-full group-has-[:checked]:mv-hidden mv-group">
              {loaderData.upcomingCanceledEvents.map((event, index) => {
                return (
                  <li
                    key={`canceled-event-${event.slug}`}
                    className={`mv-w-full mv-min-h-[110px] mv-overflow-hidden p-4 @md:mv-p-0 @md:mv-pr-4 @lg:mv-pr-6 mv-bg-negative-50 mv-rounded-r-lg mv-rounded-l-lg @sm:mv-rounded-r-xl @md:mv-rounded-r-2xl mv-gap-4 @sm:mv-gap-6 mv-flex-col @sm:mv-flex-row @sm:mv-items-center ${
                      index > 1
                        ? "mv-hidden group-has-[:checked]:mv-flex"
                        : "mv-flex"
                    }`}
                  >
                    <div className="mv-hidden @md:mv-block mv-w-[165px] mv-h-[110px] mv-shrink-0 mv-bg-neutral-200">
                      <Image
                        alt={event.name}
                        src={event.background}
                        blurredSrc={event.blurredBackground}
                      />
                    </div>
                    <div className="mv-flex mv-flex-col mv-gap-2 @sm:mv-grow">
                      <h3 className="mv-text-negative-700 mv-text-xs mv-font-bold mv-leading-4">
                        {loaderData.locales.content.notifications.canceled}
                      </h3>
                      <p className="mv-line-clamp-2 mv-text-neutral-700 mv-text-2xl mv-font-bold mv-leading-[26px]">
                        {event.name}
                      </p>
                    </div>
                    <Button
                      className="mv-w-full @sm:mv-shrink"
                      as="a"
                      href="/my/events"
                      variant="outline"
                    >
                      {loaderData.locales.content.notifications.cta}
                    </Button>
                  </li>
                );
              })}
              {loaderData.upcomingCanceledEvents.length > 2 ? (
                <div
                  key="show-more-canceled-events-container"
                  className="mv-w-full mv-flex mv-justify-center mv-pt-2 mv-text-sm mv-text-neutral-600 mv-font-semibold mv-leading-5 mv-justify-self-center"
                >
                  <label
                    htmlFor="show-more-canceled-events"
                    className="mv-flex mv-gap-2 mv-cursor-pointer mv-w-fit"
                  >
                    <div className="group-has-[:checked]:mv-hidden">
                      {loaderData.locales.content.notifications.showMore}
                    </div>
                    <div className="mv-hidden group-has-[:checked]:mv-block">
                      {loaderData.locales.content.notifications.showLess}
                    </div>
                    <div className="mv-rotate-90 group-has-[:checked]:-mv-rotate-90">
                      <Icon type="chevron-right" />
                    </div>
                  </label>
                  <input
                    id="show-more-canceled-events"
                    type="checkbox"
                    className="mv-w-0 mv-h-0 mv-opacity-0"
                  />
                </div>
              ) : null}
            </ul>
          ) : null}
        </section>
      ) : null}
      {/* Updates Section */}
      <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl mv-group">
        <div className="mv-w-full mv-flex mv-justify-between mv-gap-8 mv-mb-4 mv-items-end">
          <h2 className="mv-appearance-none mv-w-full mv-text-neutral-700 mv-text-2xl mv-leading-[26px] mv-font-semibold mv-shrink">
            {loaderData.locales.content.updateTeasers.headline}
          </h2>
          <div className="mv-text-nowrap mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline">
            <label
              htmlFor="hide-updates"
              className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline mv-hidden group-has-[:checked]:mv-inline"
            >
              {loaderData.locales.content.updateTeasers.show}
            </label>
            <label
              htmlFor="hide-updates"
              className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline group-has-[:checked]:mv-hidden"
            >
              {loaderData.locales.content.updateTeasers.hide}
            </label>
            <input
              id="hide-updates"
              type="checkbox"
              onChange={() => {
                const hideUpdates =
                  Cookies.get("mv-hide-updates") === "true" ? false : true;
                Cookies.set("mv-hide-updates", hideUpdates.toString(), {
                  sameSite: "strict",
                });
                setHideUpdates(hideUpdates);
              }}
              checked={hideUpdates === true}
              className="mv-w-0 mv-h-0 mv-opacity-0"
            />
          </div>
        </div>
        {hideUpdates === false ? (
          <ul className="mv-flex mv-flex-col @xl:mv-grid @xl:mv-grid-cols-2 @xl:mv-grid-rows-1 mv-gap-4 @xl:mv-gap-6 mv-w-full group-has-[:checked]:mv-hidden">
            {Object.entries(updateTeasers).map(([key, value]) => {
              // Runtime check to safely use type assertion below
              if (
                key in loaderData.locales.content.updateTeasers.entries ===
                false
              ) {
                console.error(`No locale found for update teaser ${key}`);
                return null;
              }
              type LocaleKey =
                keyof typeof loaderData.locales.content.updateTeasers.entries;
              return (
                <TeaserCard
                  key={`${key}-update-teaser`}
                  to={value.link}
                  external={value.external}
                  headline={
                    loaderData.locales.content.updateTeasers.entries[
                      key as LocaleKey
                    ].headline
                  }
                  description={
                    loaderData.locales.content.updateTeasers.entries[
                      key as LocaleKey
                    ].description
                  }
                  linkDescription={
                    loaderData.locales.content.updateTeasers.entries[
                      key as LocaleKey
                    ].linkDescription
                  }
                  iconType={value.icon}
                />
              );
            })}
          </ul>
        ) : null}
      </section>
      {/* News Section */}
      <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl mv-group">
        <div className="mv-w-full mv-flex mv-justify-between mv-gap-8 mv-mb-4 mv-items-end">
          <h2 className="mv-appearance-none mv-w-full mv-text-neutral-700 mv-text-2xl mv-leading-[26px] mv-font-semibold mv-shrink">
            {loaderData.locales.content.newsTeaser.headline}
          </h2>
          <div className="mv-text-nowrap mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline">
            <label
              htmlFor="hide-news"
              className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline mv-hidden group-has-[:checked]:mv-inline"
            >
              {loaderData.locales.content.newsTeaser.show}
            </label>
            <label
              htmlFor="hide-news"
              className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline group-has-[:checked]:mv-hidden"
            >
              {loaderData.locales.content.newsTeaser.hide}
            </label>
            <input
              id="hide-news"
              type="checkbox"
              onChange={() => {
                const hideNews =
                  Cookies.get("mv-hide-news") === "true" ? false : true;
                Cookies.set("mv-hide-news", hideNews.toString(), {
                  sameSite: "strict",
                });
                setHideNews(hideNews);
              }}
              className="mv-w-0 mv-h-0 mv-opacity-0"
              checked={hideNews === true}
            />
          </div>
        </div>
        {hideNews === false ? (
          <ul className="mv-flex mv-flex-col @xl:mv-grid @xl:mv-grid-cols-2 @xl:mv-grid-rows-1 mv-gap-4 @xl:mv-gap-6 mv-w-full group-has-[:checked]:mv-hidden">
            {Object.entries(newsTeasers).map(([key, value]) => {
              // Runtime check to safely use type assertion below
              if (
                key in loaderData.locales.content.newsTeaser.entries ===
                false
              ) {
                console.error(`No locale found for news teaser ${key}`);
                return null;
              }
              type LocaleKey =
                keyof typeof loaderData.locales.content.newsTeaser.entries;
              return (
                <TeaserCard
                  key={`${key}-news-teaser`}
                  to={value.link}
                  external={value.external}
                  headline={
                    loaderData.locales.content.newsTeaser.entries[
                      key as LocaleKey
                    ].headline
                  }
                  description={
                    loaderData.locales.content.newsTeaser.entries[
                      key as LocaleKey
                    ].description
                  }
                  linkDescription={
                    loaderData.locales.content.newsTeaser.entries[
                      key as LocaleKey
                    ].linkDescription
                  }
                  iconType={value.icon}
                  type="secondary"
                />
              );
            })}
          </ul>
        ) : null}
      </section>
      {/* Community Counter */}
      <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-flex mv-flex-col mv-w-full mv-items-center mv-gap-6 mv-py-6 mv-bg-white mv-border mv-border-neutral-200 mv-rounded-lg">
          <h2 className="mv-appearance-none mv-w-full mv-text-primary mv-text-center mv-text-3xl mv-font-semibold mv-leading-7 @lg:mv-leading-8 mv-px-11 @lg:mv-px-6">
            {loaderData.locales.content.communityCounter.headline}
          </h2>
          <ul className="mv-grid mv-grid-cols-2 mv-grid-rows-2 mv-place-items-center mv-w-fit mv-gap-x-6 mv-gap-y-8 mv-px-6 @lg:mv-gap-x-16 @lg:mv-grid-cols-4 @lg:mv-grid-rows-1">
            {Object.entries(loaderData.communityCounter).map(([key, value]) => {
              // Runtime check to safely use type assertion below
              if (
                key in loaderData.locales.content.communityCounter ===
                false
              ) {
                console.error(`No locale found for community counter ${key}`);
                return null;
              }
              type LocaleKey =
                keyof typeof loaderData.locales.content.communityCounter;
              return (
                <li
                  key={`${key}-counter`}
                  className="mv-grid mv-grid-cols-1 mv-grid-rows-2 mv-place-items-center mv-gap-2"
                >
                  <div className="mv-text-5xl mv-font-bold mv-leading-10 mv-text-primary">
                    {value}
                  </div>
                  <div className="mv-text-lg mv-font-bold mv-leading-6 mv-text-primary">
                    {
                      loaderData.locales.content.communityCounter[
                        key as LocaleKey
                      ]
                    }
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      {/* Profile Card Section */}
      <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 @lg:mv-text-5xl @lg:mv-leading-9">
            {loaderData.locales.content.profiles}
          </div>
          <div className="mv-text-right">
            <MVLink to="/explore/profiles">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {loaderData.locales.content.allProfiles}
              </span>
            </MVLink>
          </div>
        </div>
        <div className="@xl:mv-px-2">
          <CardContainer>
            {loaderData.profiles.map((profile) => {
              return (
                <ProfileCard
                  key={`newest-profile-card-${profile.username}`}
                  profile={profile}
                  locales={loaderData.locales}
                />
              );
            })}
          </CardContainer>
        </div>
      </section>
      {/* Organization Card Section */}
      <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 @lg:mv-text-5xl @lg:mv-leading-9">
            {loaderData.locales.content.organizations}
          </div>
          <div className="mv-text-right">
            <MVLink to="/explore/organizations">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {loaderData.locales.content.allOrganizations}
              </span>
            </MVLink>
          </div>
        </div>
        <div className="@xl:mv-px-2">
          <CardContainer>
            {loaderData.organizations.map((organization) => {
              return (
                <OrganizationCard
                  key={`newest-organization-card-${organization.slug}`}
                  organization={organization}
                  locales={loaderData.locales}
                />
              );
            })}
          </CardContainer>
        </div>
      </section>
      {/* Project Card Section */}
      <section className="mv-w-full mv-mx-auto mv-mb-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 @lg:mv-text-5xl @lg:mv-leading-9">
            {loaderData.locales.content.projects}
          </div>
          <div className="mv-text-right">
            <MVLink to="/explore/projects">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {loaderData.locales.content.allProjects}
              </span>
            </MVLink>
          </div>
        </div>
        <div className="@xl:mv-px-2">
          <CardContainer>
            {loaderData.projects.map((project) => {
              return (
                <ProjectCard
                  key={`newest-project-card-${project.slug}`}
                  project={project}
                  locales={loaderData.locales}
                />
              );
            })}
          </CardContainer>
        </div>
      </section>
      {/* Event Card Section */}
      <section className="mv-w-full mv-mb-12 mv-mx-auto @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-flex mv-mb-4 mv-px-4 @xl:mv-px-6 @lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 @lg:mv-text-5xl @lg:mv-leading-9">
            {loaderData.locales.content.events}
          </div>
          <div className="mv-text-right">
            <MVLink to="/explore/events">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {loaderData.locales.content.allEvents}
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
                  key={`newest-event-card-${event.slug}`}
                  locales={loaderData.locales}
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
      {/* External Links Section */}
      <section className="mv-w-full mv-mb-24 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <h2 className="mv-appearance-none mv-w-full mv-mb-6 mv-text-neutral-700 mv-text-2xl mv-leading-[26px] mv-font-semibold">
          {loaderData.locales.content.externalTeasers.headline}
        </h2>
        <ul className="mv-flex mv-flex-col @xl:mv-grid @xl:mv-grid-cols-3 @xl:mv-grid-rows-1 mv-gap-6 @xl:mv-gap-8 mv-w-full">
          {Object.entries(externalTeasers).map(([key, value]) => {
            // Runtime check to safely use type assertion below
            if (
              key in loaderData.locales.content.externalTeasers.entries ===
              false
            ) {
              console.error(`No locale found for external teaser ${key}`);
              return null;
            }
            type LocaleKey =
              keyof typeof loaderData.locales.content.externalTeasers.entries;
            return (
              <TeaserCard
                to={value.link}
                external={value.external}
                key={`${key}-external-link-teaser`}
                headline={
                  loaderData.locales.content.externalTeasers.entries[
                    key as LocaleKey
                  ].headline
                }
                description={
                  loaderData.locales.content.externalTeasers.entries[
                    key as LocaleKey
                  ].description
                }
                linkDescription={
                  loaderData.locales.content.externalTeasers.entries[
                    key as LocaleKey
                  ].linkDescription
                }
                iconType={value.icon}
              />
            );
          })}
        </ul>
      </section>
    </>
  );
}

export default Dashboard;
