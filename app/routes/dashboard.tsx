import {
  Button,
  Link,
  OrganizationCard,
  ProfileCard,
} from "@mint-vernetzt/components";
import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { notFound } from "remix-utils";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { prismaClient } from "~/prisma";
import { getProfileByUsername } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { getRandomSeed } from "./explore/utils.server";
import React from "react";

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const featureAbilities = await getFeatureAbilities(authClient, "dashboard");
  if (featureAbilities["dashboard"].hasAccess === false) {
    return redirect("/");
  }

  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirect("/login");
  }

  const profile = await getProfileByUsername(
    sessionUser.user_metadata.username
  );
  if (profile === null) {
    throw notFound({ message: "Profile not found" });
  }

  let randomSeed = getRandomSeed(request);
  if (randomSeed === undefined) {
    randomSeed = parseFloat((Math.random() / 4).toFixed(3)); // use top 25% of profiles
    return redirect(`/dashboard?randomSeed=${randomSeed}`, {
      headers: response.headers,
    });
  }

  const numberOfProfiles = 3;
  const profileCount = await prismaClient.profile.count();
  const rawProfiles = await prismaClient.profile.findMany({
    include: {
      offers: { select: { offer: { select: { title: true } } } },
      areas: { select: { area: { select: { name: true } } } },
      memberOf: {
        select: {
          organization: {
            select: {
              slug: true,
              logo: true,
              name: true,
            },
          },
        },
        orderBy: {
          organization: {
            updatedAt: "asc",
          },
        },
      },
      _count: {
        select: {
          memberOf: true,
        },
      },
    },
    skip: Math.floor(randomSeed * (profileCount - numberOfProfiles)),
    take: numberOfProfiles,
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
  });

  const profiles = rawProfiles.map((profile) => {
    const {
      bio,
      position,
      avatar,
      background,
      publicFields,
      areas,
      memberOf,
      offers,
      ...otherFields
    } = profile;
    let extensions: {
      bio?: string;
      position?: string;
      areaNames: string[];
      memberOf: { name: string; slug: string; logo: string | null }[];
      offers: string[];
    } = { areaNames: [], memberOf: [], offers: [] };

    if (
      ((publicFields !== null && publicFields.includes("bio")) ||
        sessionUser !== null) &&
      bio !== null
    ) {
      extensions.bio = bio;
    }
    if (
      ((publicFields !== null && publicFields.includes("position")) ||
        sessionUser !== null) &&
      position !== null
    ) {
      extensions.position = position;
    }

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

    if (
      (publicFields !== null && publicFields.includes("areas")) ||
      sessionUser !== null
    ) {
      extensions.areaNames = areas.map((relation) => {
        return relation.area.name;
      });
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

    if (
      (publicFields !== null && publicFields.includes("offers")) ||
      sessionUser !== null
    ) {
      extensions.offers = offers.map((relation) => {
        return relation.offer.title;
      });
    }

    return {
      ...otherFields,
      ...extensions,
      avatar: avatarImage,
      background: backgroundImage,
    };
  });

  const numberOfOrganizations = 3;
  const organizationCount = await prismaClient.organization.count();
  const rawOrganizations = await prismaClient.organization.findMany({
    include: {
      focuses: { select: { focus: { select: { title: true } } } },
      areas: { select: { area: { select: { name: true } } } },
      types: { select: { organizationType: { select: { title: true } } } },
      teamMembers: {
        select: {
          profile: {
            select: {
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          profile: {
            updatedAt: "asc",
          },
        },
      },
      _count: {
        select: {
          memberOf: true,
        },
      },
    },
    skip: Math.floor(randomSeed * (organizationCount - numberOfOrganizations)),
    take: numberOfOrganizations,
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
  });

  const organizations = rawOrganizations.map((organization) => {
    const {
      logo,
      background,
      publicFields,
      areas,
      teamMembers,
      focuses,
      types,
      ...otherFields
    } = organization;
    let extensions: {
      areaNames: string[];
      teamMembers: {
        firstName: string;
        lastName: string;
        username: string;
        avatar: string | null;
      }[];
      focuses: string[];
      types: string[];
    } = { areaNames: [], teamMembers: [], focuses: [], types: [] };

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

    extensions.areaNames = areas.map((relation) => {
      return relation.area.name;
    });

    extensions.types = types.map((relation) => {
      return relation.organizationType.title;
    });

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

    extensions.focuses = focuses.map((relation) => {
      return relation.focus.title;
    });

    return {
      ...otherFields,
      ...extensions,
      logo: logoImage,
      background: backgroundImage,
    };
  });

  return json(
    {
      profiles,
      organizations,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
    },
    { headers: response.headers }
  );
};

function ScrollContainer(props: React.HTMLAttributes<HTMLDivElement>) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child);
    }
  );
  return (
    <div className="mv-flex mv-ml-2 sm:mv-mx-0 sm:mv-px-2 mv-overflow-x-scroll lg:mv-overflow-x-visible mv-items-stretch">
      {validChildren.map((child, index) => {
        return (
          <div
            key={`item-${index}`}
            className="mv-flex-none mv-w-3/4 sm:mv-w-1/2 lg:mv-w-1/3 mv-pb-8 mv-px-2 last:mv-pr-4 sm:last:mv-pr-2"
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

function Dashboard() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="relative pb-44">
      <div className="">
        <main>
          <section className="mv-w-full mv-mx-auto mv-px-4 mv-max-w-[600px] md:mv-max-w-[768px] lg:mv-max-w-[1024px] xl:mv-max-w-[1280px] xl:mv-px-6 2xl:mv-max-w-[1563px] mv-mb-4 lg:mv-mb-16">
            <h1 className="mv-text-primary mv-font-black mv-text-5xl lg:mv-text-7xl mv-leading-tight mv-mb-2">
              Willkommen,
              <br />
              {loaderData.firstName} {loaderData.lastName}
            </h1>
            <p className="mv-font-semibold mv-mb-4">
              in Deiner MINTvernetzt-Community!
            </p>
            <p>
              <Button
                variant="outline"
                as="a"
                href={`/profile/${loaderData.username}`}
              >
                Mein Profil besuchen
              </Button>
            </p>
          </section>
          <section className="mv-w-full mv-mx-auto mv-max-w-[600px] md:mv-max-w-[768px] lg:mv-max-w-[1024px] xl:mv-max-w-[1280px] 2xl:mv-max-w-[1563px]">
            <div className="mv-flex mv-mb-4 mv-px-4 lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
              <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 lg:mv-text-5xl lg:mv-leading-9">
                Profile
              </div>
              <div className="mv-text-right">
                <Link to="/explore/profiles">
                  <span className="mv-text-sm mv-font-semibold mv-leading-4 lg:mv-text-2xl lg:mv-leading-7">
                    Alle Profile
                  </span>
                </Link>
              </div>
            </div>
            <ScrollContainer>
              {loaderData.profiles.map((profile) => {
                return <ProfileCard key={profile.username} profile={profile} />;
              })}
            </ScrollContainer>
          </section>
          <section className="mv-w-full mv-mx-auto mv-max-w-[600px] md:mv-max-w-[768px] lg:mv-max-w-[1024px] xl:mv-max-w-[1280px] 2xl:mv-max-w-[1563px]">
            <div className="mv-flex mv-mb-4 mv-px-4 lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
              <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 lg:mv-text-5xl lg:mv-leading-9">
                Organisationen
              </div>
              <div className="mv-text-right">
                <Link to="/explore/organizations">
                  <span className="mv-text-sm mv-font-semibold mv-leading-4 lg:mv-text-2xl lg:mv-leading-7">
                    Alle Organisationen
                  </span>
                </Link>
              </div>
            </div>
            <ScrollContainer>
              {loaderData.organizations.map((organization) => {
                return (
                  <OrganizationCard
                    key={organization.slug}
                    organization={organization}
                  />
                );
              })}
            </ScrollContainer>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
