import { Link as MVLink } from "@mint-vernetzt/components/src/molecules/Link";
import type { Organization, Profile } from "@prisma/client";
import { utcToZonedTime } from "date-fns-tz";
import Cookies from "js-cookie";
import React from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
} from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import {
  DefaultImages,
  ImageAspects,
  MaxImageSizes,
  MinCropSizes,
} from "~/images.shared";
import { detectLanguage } from "~/root.server";
import { getPublicURL, parseMultipartFormData } from "~/storage.server";
// import styles from "../../common/design/styles/styles.css?url";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { EventCard } from "@mint-vernetzt/components/src/organisms/cards/EventCard";
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
import { ProfileCard } from "@mint-vernetzt/components/src/organisms/cards/ProfileCard";
import { ProjectCard } from "@mint-vernetzt/components/src/organisms/cards/ProjectCard";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { captureException } from "@sentry/node";
import rcSliderStyles from "rc-slider/assets/index.css?url";
import reactCropStyles from "react-image-crop/dist/ReactCrop.css?url";
import { Icon } from "~/components-next/icons/Icon";
import { Modal } from "~/components-next/Modal";
import { TeaserCard, type TeaserIconType } from "~/components-next/TeaserCard";
import ImageCropper, {
  IMAGE_CROPPER_DISCONNECT_INTENT_VALUE,
} from "~/components/ImageCropper/ImageCropper";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { type AtLeastOne } from "~/lib/utils/types";
import { languageModuleMap } from "~/locales/.server";
import { UPLOAD_INTENT_VALUE } from "~/storage.shared";
import { redirectWithToast } from "~/toast.server";
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
import { getFeatureAbilities } from "./feature-access.server";
import { disconnectImage, uploadImage } from "./profile/$username/index.server";
import {
  getEventCount,
  getOrganizationCount,
  getProfileCount,
  getProjectCount,
} from "./utils.server";

export function links() {
  return [
    { rel: "stylesheet", href: rcSliderStyles },
    { rel: "stylesheet", href: reactCropStyles },
  ];
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["dashboard"];
  const imageCropperLocales =
    languageModuleMap[language]["profile/$username/index"];

  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const profile = await getProfileById(sessionUser.id, authClient);
  if (profile === null) {
    invariantResponse(false, locales.route.error.profileNotFound, {
      status: 404,
    });
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
  const abilities = await getFeatureAbilities(authClient, "news_section");

  return {
    communityCounter,
    profiles,
    organizations,
    events,
    projects,
    organizationsFromInvites,
    profilesFromRequests,
    upcomingCanceledEvents,
    locales,
    imageCropperLocales,
    language,
    abilities,
    ...profile,
    currentTimestamp: Date.now(),
  };
};

function getDataForExternalTeasers() {
  type ExternalTeaserKey = keyof Awaited<
    ReturnType<typeof useLoaderData<typeof loader>>
  >["locales"]["route"]["content"]["externalTeasers"]["entries"];
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
  >["locales"]["route"]["content"]["updateTeasers"]["entries"];
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
  >["locales"]["route"]["content"]["newsTeaser"]["entries"];
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

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["profile/$username/index"];

  const profile = await getProfileById(sessionUser.id, authClient);
  if (profile === null) {
    invariantResponse(false, locales.route.error.profileNotFound, {
      status: 404,
    });
  }

  invariantResponse(sessionUser !== null, "Forbidden", { status: 403 });

  const { formData, error } = await parseMultipartFormData(request);
  if (error !== null || formData === null) {
    console.error({ error });
    captureException(error);
    // TODO: How can we add this to the zod ctx?
    return redirectWithToast(request.url, {
      id: "upload-failed",
      key: `${new Date().getTime()}`,
      message: locales.route.error.onStoring,
      level: "negative",
    });
  }

  const intent = formData.get(INTENT_FIELD_NAME);
  let submission;
  let toast;
  let redirectUrl: string | null = request.url;

  const username = profile.username;

  if (intent === UPLOAD_INTENT_VALUE) {
    const result = await uploadImage({
      request,
      formData,
      authClient,
      username,
      locales,
    });
    submission = result.submission;
    toast = result.toast;
    redirectUrl = result.redirectUrl || request.url;
  } else if (intent === IMAGE_CROPPER_DISCONNECT_INTENT_VALUE) {
    const result = await disconnectImage({
      request,
      formData,
      username,
      locales,
    });
    submission = result.submission;
    toast = result.toast;
    redirectUrl = result.redirectUrl || request.url;
  } else {
    // TODO: How can we add this to the zod ctx?
    return redirectWithToast(request.url, {
      id: "invalid-action",
      key: `${new Date().getTime()}`,
      message: locales.route.error.invalidAction,
      level: "negative",
    });
  }

  if (submission !== null) {
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
  }
  if (toast === null) {
    return redirect(redirectUrl);
  }
  return redirectWithToast(redirectUrl, toast);
};

function Dashboard() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const location = useLocation();

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
      {
        <section className="mv-w-full mv-bg-gradient-to-b from-neutral-50 to-white mv-h-[480px] @md:mv-h-[571px] mv-mb-10 mv-relative">
          {/* svg top */}
          <div className="mv-absolute mv-top-0 mv-w-[304px] @md:mv-w-[607px] mv-h-[169px] @md:mv-h-[339px]">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 607 339"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M-278.555 -350.276C-94.7497 -580.614 166.353 -619.882 320.556 -440.434C436.831 -305.124 461.732 -339.258 474.697 -228.127C495.055 -53.6284 397.38 -26.1201 256.574 106.328C49.7733 300.855 -54.9258 274.68 -133.14 216.844C-179.261 182.739 -524.293 -42.3257 -278.555 -350.276Z"
                fill="#FCC433"
              />
              <path
                d="M-80.5089 145.289C147.048 84.0027 463.675 37.106 518.315 -49.3929C545.635 -92.6424 485.441 -210.274 425.29 -291.988C318.82 -436.626 190.291 -493.722 10.7109 -491.051C-258.403 -487.049 -577.101 -199.684 -494.829 -22.6444C-424.098 129.56 -216.261 181.85 -80.5089 145.289Z"
                stroke="#154194"
              />
            </svg>
          </div>
          {/* svg bottom */}
          <div className="mv-absolute mv-bottom-0 mv-right-0 mv-w-[400px] @md:mv-w-[800px] mv-h-[207px] @md:mv-h-[415px]">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 800 415"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M546.315 249.734C624.782 229.199 715.885 285.197 730.99 291.223C746.096 297.249 907.379 372.508 993.621 439.219C1101.42 522.607 1050.11 639.435 949.589 892.638C849.069 1145.84 747.832 1108.41 429.04 946.34C94.5001 776.261 249.166 600.785 308.857 496.092C368.548 391.399 467.848 270.27 546.315 249.734Z"
                fill="#FCC433"
              />
              <path
                d="M1104.45 741.607C1094.26 826.675 1003.96 894.534 992.186 907.047C980.415 919.559 844.013 1048.94 745.063 1107.87C621.376 1181.54 526.421 1085.88 316.482 889.066C106.544 692.253 182.52 607.245 465.22 356.674C761.885 93.7261 874.47 313.665 954.256 412.859C1034.04 512.053 1114.65 656.538 1104.45 741.607Z"
                stroke="#B16FAB"
              />
            </svg>
          </div>
          <div className="mv-flex mv-flex-col mv-items-center">
            <div className="mv-relative mv-mt-14 mv-flex mv-flex-col mv-items-center">
              <div className="mv-w-[136px] mv-h-[136px] mv-rounded-full mv-shadow-[0_4px_16px_0_rgba(0,0,0,0.12)]">
                <div className="mv-relative">
                  <Avatar
                    avatar={loaderData.avatar}
                    blurredAvatar={
                      loaderData.blurredAvatar === null
                        ? undefined
                        : loaderData.blurredAvatar
                    }
                    firstName={loaderData.firstName}
                    lastName={loaderData.lastName}
                    size="full"
                    textSize="xl"
                  />
                  <button
                    type="submit"
                    form="modal-avatar-form"
                    className="mv-hidden @lg:mv-grid mv-absolute mv-top-0 mv-w-full mv-h-full mv-rounded-full mv-opacity-0 hover:mv-opacity-100 focus-within:mv-opacity-100 mv-bg-opacity-0 hover:mv-bg-opacity-70 focus-within:mv-bg-opacity-70 mv-transition-all mv-bg-neutral-700 mv-grid-rows-1 mv-grid-cols-1 mv-place-items-center mv-cursor-pointer"
                  >
                    <div className="mv-flex mv-flex-col mv-items-center mv-gap-1">
                      <div className="mv-w-8 mv-h-8 mv-rounded-full mv-bg-neutral-50 mv-flex mv-items-center mv-justify-center mv-border mv-border-primary mv-bg-opacity-100">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M15 12C15 12.5523 14.5523 13 14 13H2C1.44772 13 1 12.5523 1 12V6C1 5.44772 1.44772 5 2 5H3.17157C3.96722 5 4.73028 4.68393 5.29289 4.12132L6.12132 3.29289C6.30886 3.10536 6.56321 3 6.82843 3H9.17157C9.43679 3 9.69114 3.10536 9.87868 3.29289L10.7071 4.12132C11.2697 4.68393 12.0328 5 12.8284 5H14C14.5523 5 15 5.44772 15 6V12ZM2 4C0.895431 4 0 4.89543 0 6V12C0 13.1046 0.895431 14 2 14H14C15.1046 14 16 13.1046 16 12V6C16 4.89543 15.1046 4 14 4H12.8284C12.298 4 11.7893 3.78929 11.4142 3.41421L10.5858 2.58579C10.2107 2.21071 9.70201 2 9.17157 2H6.82843C6.29799 2 5.78929 2.21071 5.41421 2.58579L4.58579 3.41421C4.21071 3.78929 3.70201 4 3.17157 4H2Z"
                            fill="#154194"
                          />
                          <path
                            d="M8 11C6.61929 11 5.5 9.88071 5.5 8.5C5.5 7.11929 6.61929 6 8 6C9.38071 6 10.5 7.11929 10.5 8.5C10.5 9.88071 9.38071 11 8 11ZM8 12C9.933 12 11.5 10.433 11.5 8.5C11.5 6.567 9.933 5 8 5C6.067 5 4.5 6.567 4.5 8.5C4.5 10.433 6.067 12 8 12Z"
                            fill="#154194"
                          />
                          <path
                            d="M3 6.5C3 6.77614 2.77614 7 2.5 7C2.22386 7 2 6.77614 2 6.5C2 6.22386 2.22386 6 2.5 6C2.77614 6 3 6.22386 3 6.5Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <p className="mv-text-white mv-text-sm mv-font-semibold mv-leading-4">
                        {loaderData.locales.route.content.header.controls.edit}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
              <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-2 mv-mb-4 mv-text-center">
                <h1 className="mv-text-[2.25rem] @md:mv-text-[2.5rem] mv-font-black mv-text-primary-500 mv-leading-[3.25rem]">
                  {insertParametersIntoLocale(
                    loaderData.locales.route.content.header.welcome,
                    {
                      firstName: loaderData.firstName,
                      lastName: loaderData.lastName,
                    }
                  )}
                </h1>
                <p className="mv-text-base @md:mv-text-lg mv-font-normal @md:mv-font-semibold">
                  {loaderData.locales.route.content.header.subline}
                </p>
              </div>
              <Button
                variant="outline"
                as="a"
                href={`/profile/${loaderData.username}`}
              >
                {loaderData.locales.route.content.header.cta}
              </Button>
            </div>
          </div>
        </section>
      }
      {/* <section className="mv-w-full mv-mx-auto mv-m-8 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-px-4 @xl:mv-px-6">
          <h1 className="mv-text-primary mv-font-black mv-text-5xl @lg:mv-text-7xl mv-leading-tight mv-mb-2">
            {loaderData.locales.route.content.welcome}
            <br />
            {loaderData.firstName} {loaderData.lastName}
          </h1>
          <p className="mv-font-semibold mv-mb-6">
            {loaderData.locales.route.content.community}
          </p>
          <Button
            variant="outline"
            as="a"
            href={`/profile/${loaderData.username}`}
          >
            {loaderData.locales.route.content.myProfile}
          </Button>
        </div>
      </section> */}
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
                {insertParametersIntoLocale(
                  decideBetweenSingularOrPlural(
                    loaderData.locales.route.content.invites.headline_one,
                    loaderData.locales.route.content.invites.headline_other,
                    loaderData.organizationsFromInvites.length
                  ),
                  { count: loaderData.organizationsFromInvites.length }
                )}
              </h3>
              <p className="mv-text-normal mv-text-sm">
                {loaderData.locales.route.content.invites.description}
              </p>
            </div>
            <Button as="a" href="/my/organizations">
              {loaderData.locales.route.content.invites.linkDescription}
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
                {insertParametersIntoLocale(
                  decideBetweenSingularOrPlural(
                    loaderData.locales.route.content.requests.headline_one,
                    loaderData.locales.route.content.requests.headline_other,
                    loaderData.profilesFromRequests.length
                  ),
                  { count: loaderData.profilesFromRequests.length }
                )}
              </h3>
              <p className="mv-text-normal mv-text-sm">
                {loaderData.locales.route.content.requests.description}
              </p>
            </div>
            <Button as="a" href="/my/organizations">
              {loaderData.locales.route.content.requests.linkDescription}
            </Button>
          </div>
        </section>
      )}
      {/* Notifications Section */}
      {loaderData.upcomingCanceledEvents.length > 0 ? (
        <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-w-full mv-flex mv-justify-between mv-gap-8 mv-mb-4 mv-items-end mv-group">
            <h2 className="mv-appearance-none mv-w-full mv-text-neutral-700 mv-text-2xl mv-leading-[26px] mv-font-semibold mv-shrink">
              {loaderData.locales.route.content.notifications.headline}
            </h2>
            <div className="mv-text-nowrap mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline">
              <label
                htmlFor="hide-notifications"
                className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline mv-hidden group-has-[:checked]:mv-inline"
              >
                {loaderData.locales.route.content.notifications.show}
              </label>
              <label
                htmlFor="hide-notifications"
                className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline group-has-[:checked]:mv-hidden"
              >
                {loaderData.locales.route.content.notifications.hide}
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
                        {
                          loaderData.locales.route.content.notifications
                            .canceled
                        }
                      </h3>
                      <p className="mv-line-clamp-2 mv-text-neutral-700 mv-text-2xl mv-font-bold mv-leading-[26px]">
                        {event.name}
                      </p>
                    </div>
                    <div>
                      <Button
                        className="mv-w-full @sm:mv-shrink"
                        as="a"
                        href="/my/events"
                        variant="outline"
                      >
                        {loaderData.locales.route.content.notifications.cta}
                      </Button>
                    </div>
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
                      {loaderData.locales.route.content.notifications.showMore}
                    </div>
                    <div className="mv-hidden group-has-[:checked]:mv-block">
                      {loaderData.locales.route.content.notifications.showLess}
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
            {loaderData.locales.route.content.updateTeasers.headline}
          </h2>
          <div className="mv-text-nowrap mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline">
            <label
              htmlFor="hide-updates"
              className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline mv-hidden group-has-[:checked]:mv-inline"
            >
              {loaderData.locales.route.content.updateTeasers.show}
            </label>
            <label
              htmlFor="hide-updates"
              className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline group-has-[:checked]:mv-hidden"
            >
              {loaderData.locales.route.content.updateTeasers.hide}
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
                key in
                  loaderData.locales.route.content.updateTeasers.entries ===
                false
              ) {
                console.error(`No locale found for update teaser ${key}`);
                return null;
              }
              type LocaleKey =
                keyof typeof loaderData.locales.route.content.updateTeasers.entries;
              return (
                <TeaserCard
                  key={`${key}-update-teaser`}
                  to={value.link}
                  external={value.external}
                  headline={
                    loaderData.locales.route.content.updateTeasers.entries[
                      key as LocaleKey
                    ].headline
                  }
                  description={
                    loaderData.locales.route.content.updateTeasers.entries[
                      key as LocaleKey
                    ].description
                  }
                  linkDescription={
                    loaderData.locales.route.content.updateTeasers.entries[
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
      {loaderData.abilities.news_section.hasAccess ? (
        <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl mv-group">
          <div className="mv-w-full mv-flex mv-justify-between mv-gap-8 mv-mb-4 mv-items-end">
            <h2 className="mv-appearance-none mv-w-full mv-text-neutral-700 mv-text-2xl mv-leading-[26px] mv-font-semibold mv-shrink">
              {loaderData.locales.route.content.newsTeaser.headline}
            </h2>
            <div className="mv-text-nowrap mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline">
              <label
                htmlFor="hide-news"
                className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline mv-hidden group-has-[:checked]:mv-inline"
              >
                {loaderData.locales.route.content.newsTeaser.show}
              </label>
              <label
                htmlFor="hide-news"
                className="mv-text-nowrap mv-cursor-pointer mv-text-primary mv-text-sm @sm:mv-text-lg @xl:mv-text-xl mv-font-semibold mv-leading-5 @xl:mv-leading-normal hover:mv-underline group-has-[:checked]:mv-hidden"
              >
                {loaderData.locales.route.content.newsTeaser.hide}
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
                  key in loaderData.locales.route.content.newsTeaser.entries ===
                  false
                ) {
                  console.error(`No locale found for news teaser ${key}`);
                  return null;
                }
                type LocaleKey =
                  keyof typeof loaderData.locales.route.content.newsTeaser.entries;
                return (
                  <TeaserCard
                    key={`${key}-news-teaser`}
                    to={value.link}
                    external={value.external}
                    headline={
                      loaderData.locales.route.content.newsTeaser.entries[
                        key as LocaleKey
                      ].headline
                    }
                    description={
                      loaderData.locales.route.content.newsTeaser.entries[
                        key as LocaleKey
                      ].description
                    }
                    linkDescription={
                      loaderData.locales.route.content.newsTeaser.entries[
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
      ) : null}
      {/* Community Counter */}
      <section className="mv-w-full mv-mb-8 mv-mx-auto mv-px-4 @xl:mv-px-6 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-flex mv-flex-col mv-w-full mv-items-center mv-gap-6 mv-py-6 mv-bg-white mv-border mv-border-neutral-200 mv-rounded-lg">
          <h2 className="mv-appearance-none mv-w-full mv-text-primary mv-text-center mv-text-3xl mv-font-semibold mv-leading-7 @lg:mv-leading-8 mv-px-11 @lg:mv-px-6">
            {loaderData.locales.route.content.communityCounter.headline}
          </h2>
          <ul className="mv-grid mv-grid-cols-2 mv-grid-rows-2 mv-place-items-center mv-w-fit mv-gap-x-6 mv-gap-y-8 mv-px-6 @lg:mv-gap-x-16 @lg:mv-grid-cols-4 @lg:mv-grid-rows-1">
            {Object.entries(loaderData.communityCounter).map(([key, value]) => {
              // Runtime check to safely use type assertion below
              if (
                key in loaderData.locales.route.content.communityCounter ===
                false
              ) {
                console.error(`No locale found for community counter ${key}`);
                return null;
              }
              type LocaleKey =
                keyof typeof loaderData.locales.route.content.communityCounter;
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
                      loaderData.locales.route.content.communityCounter[
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
            {loaderData.locales.route.content.profiles}
          </div>
          <div className="mv-text-right">
            <MVLink to="/explore/profiles">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {loaderData.locales.route.content.allProfiles}
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
            {loaderData.locales.route.content.organizations}
          </div>
          <div className="mv-text-right">
            <MVLink to="/explore/organizations">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {loaderData.locales.route.content.allOrganizations}
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
            {loaderData.locales.route.content.projects}
          </div>
          <div className="mv-text-right">
            <MVLink to="/explore/projects">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {loaderData.locales.route.content.allProjects}
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
            {loaderData.locales.route.content.events}
          </div>
          <div className="mv-text-right">
            <MVLink to="/explore/events">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 @lg:mv-text-2xl @lg:mv-leading-7">
                {loaderData.locales.route.content.allEvents}
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
          {loaderData.locales.route.content.externalTeasers.headline}
        </h2>
        <ul className="mv-flex mv-flex-col @xl:mv-grid @xl:mv-grid-cols-3 @xl:mv-grid-rows-1 mv-gap-6 @xl:mv-gap-8 mv-w-full">
          {Object.entries(externalTeasers).map(([key, value]) => {
            // Runtime check to safely use type assertion below
            if (
              key in
                loaderData.locales.route.content.externalTeasers.entries ===
              false
            ) {
              console.error(`No locale found for external teaser ${key}`);
              return null;
            }
            type LocaleKey =
              keyof typeof loaderData.locales.route.content.externalTeasers.entries;
            return (
              <TeaserCard
                to={value.link}
                external={value.external}
                key={`${key}-external-link-teaser`}
                headline={
                  loaderData.locales.route.content.externalTeasers.entries[
                    key as LocaleKey
                  ].headline
                }
                description={
                  loaderData.locales.route.content.externalTeasers.entries[
                    key as LocaleKey
                  ].description
                }
                linkDescription={
                  loaderData.locales.route.content.externalTeasers.entries[
                    key as LocaleKey
                  ].linkDescription
                }
                iconType={value.icon}
              />
            );
          })}
        </ul>
      </section>
      <Form
        id="modal-avatar-form"
        method="get"
        action={location.pathname}
        preventScrollReset
        hidden
      >
        <input hidden name="modal-avatar" defaultValue="true" />
      </Form>
      <Modal searchParam="modal-avatar">
        <Modal.Title>
          {loaderData.locales.route.content.cropper.avatar.headline}
        </Modal.Title>
        <Modal.Section>
          <ImageCropper
            uploadKey="avatar"
            circularCrop
            image={loaderData.avatar || undefined}
            aspect={ImageAspects.AvatarAndLogo}
            minCropWidth={MinCropSizes.AvatarAndLogo.width}
            minCropHeight={MinCropSizes.AvatarAndLogo.height}
            maxTargetWidth={MaxImageSizes.AvatarAndLogo.width}
            maxTargetHeight={MaxImageSizes.AvatarAndLogo.height}
            modalSearchParam="modal-logo"
            locales={loaderData.imageCropperLocales}
            currentTimestamp={
              typeof actionData !== "undefined"
                ? actionData.currentTimestamp
                : loaderData.currentTimestamp
            }
          >
            <Avatar
              firstName={loaderData.firstName}
              lastName={loaderData.lastName}
              avatar={loaderData.avatar}
              blurredAvatar={
                loaderData.blurredAvatar === null
                  ? undefined
                  : loaderData.blurredAvatar
              }
              size="xl"
              textSize="xl"
            />
          </ImageCropper>
        </Modal.Section>
      </Modal>
    </>
  );
}

export default Dashboard;
