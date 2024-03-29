import {
  Button,
  CardContainer,
  Link,
  OrganizationCard,
  ProfileCard,
} from "@mint-vernetzt/components";
import type { Organization, Profile } from "@prisma/client";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { GravityType, getImageURL } from "~/images.server";
import { detectLanguage } from "~/root.server";
import { getPublicURL } from "~/storage.server";
import styles from "../../common/design/styles/styles.css";
import {
  getOrganizationsForCards,
  getProfileById,
  getProfilesForCards,
} from "./dashboard.server";

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
          gravity: GravityType.center,
        });
      }
    }

    let backgroundImage: string | null = null;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        backgroundImage = getImageURL(publicURL, {
          resize: { type: "fit", width: 473, height: 160 },
        });
      }
    }

    extensions.memberOf = memberOf.map((relation, index) => {
      let logoImage: string | null = null;
      if (index < 2) {
        if (relation.organization.logo !== null) {
          const publicURL = getPublicURL(
            authClient,
            relation.organization.logo
          );
          if (publicURL !== null) {
            logoImage = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
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
          gravity: GravityType.center,
        });
      }
    }

    let backgroundImage: string | null = null;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        backgroundImage = getImageURL(publicURL, {
          resize: { type: "fit", width: 473, height: 160 },
        });
      }
    }

    extensions.teamMembers = teamMembers.map((relation, index) => {
      let avatar: string | null = null;
      if (index < 4) {
        if (relation.profile.avatar !== null) {
          const publicURL = getPublicURL(authClient, relation.profile.avatar);
          if (publicURL !== null) {
            avatar = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
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
  return json({
    profiles,
    organizations,
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
      <section className="mv-w-full mv-mx-auto mv-my-8 md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        <div className="mv-px-4 xl:mv-px-6">
          <h1 className="mv-text-primary mv-font-black mv-text-5xl lg:mv-text-7xl mv-leading-tight mv-mb-2">
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
      <section className="mv-w-full mv-mx-auto mv-mb-8 md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        {/* <section className="mv-w-full mv-mx-auto mv-mb-8 mv-max-w-[600px] md:mv-max-w-[768px] lg:mv-max-w-[1120px]"> */}
        {/* <section className="mv-w-full mv-mx-auto mv-max-w-[600px] md:mv-max-w-[768px] lg:mv-max-w-[1024px] xl:mv-max-w-[1280px] 2xl:mv-max-w-[1563px] mv-mb-16"> */}
        <div className="mv-flex mv-mb-4 mv-px-4 xl:mv-px-6 lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 lg:mv-text-5xl lg:mv-leading-9">
            {t("content.profiles")}
          </div>
          <div className="mv-text-right">
            <Link to="/explore/profiles">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 lg:mv-text-2xl lg:mv-leading-7">
                {t("content.allProfiles")}
              </span>
            </Link>
          </div>
        </div>
        <div className="xl:mv-px-2">
          <CardContainer>
            {loaderData.profiles.map((profile) => {
              return <ProfileCard key={profile.username} profile={profile} />;
            })}
          </CardContainer>
        </div>
      </section>
      <section className="mv-w-full mv-mx-auto mv-mb-8 md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        <div className="mv-flex mv-mb-4 mv-px-4 xl:mv-px-6 lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 lg:mv-text-5xl lg:mv-leading-9">
            {t("content.organizations")}
          </div>
          <div className="mv-text-right">
            <Link to="/explore/organizations">
              <span className="mv-text-sm mv-font-semibold mv-leading-4 lg:mv-text-2xl lg:mv-leading-7">
                {t("content.allOrganizations")}
              </span>
            </Link>
          </div>
        </div>
        <div className="xl:mv-px-2">
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
    </>
  );
}

export default Dashboard;
