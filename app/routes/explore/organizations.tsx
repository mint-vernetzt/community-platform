import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1, H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getAllOffers } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import {
  getAllOrganizations,
  getPaginationValues,
  getRandomSeed,
} from "./utils.server";
import { OrganizationCard } from "@mint-vernetzt/components";
import { prismaClient } from "~/prisma";

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  let randomSeed = getRandomSeed(request);
  if (randomSeed === undefined) {
    randomSeed = parseFloat(Math.random().toFixed(3));
    return redirect(`/explore/organizations?randomSeed=${randomSeed}`, {
      headers: response.headers,
    });
  }

  const { skip, take } = getPaginationValues(request);

  const sessionUser = await getSessionUser(authClient);

  const isLoggedIn = sessionUser !== null;

  const areas = await getAreas();
  const offers = await getAllOffers();

  const rawOrganizations = await getAllOrganizations({
    skip: skip,
    take: take,
    randomSeed: randomSeed,
  });

  const organizations = await Promise.all(
    rawOrganizations.map(async (organization) => {
      const { bio, publicFields, logo, background, ...otherFields } =
        organization;
      let extensions: {
        bio?: string;
        teamMembers: {
          firstName: string;
          lastName: string;
          username: string;
          avatar?: string | null;
        }[];
      } = { teamMembers: [] };

      if (
        (publicFields.includes("bio") || sessionUser !== null) &&
        bio !== null
      ) {
        extensions.bio = bio;
      }

      let logoImage: string | null = null;

      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logoImage = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
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

      const profiles = await prismaClient.profile.findMany({
        where: {
          memberOf: {
            some: {
              organizationId: organization.id,
            },
          },
        },
      });
      extensions.teamMembers = profiles.map((profile) => {
        let avatarImage: string | null = null;
        if (profile.avatar !== null) {
          const publicURL = getPublicURL(authClient, profile.avatar);
          if (publicURL !== null) {
            avatarImage = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }

        return {
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          avatar: avatarImage,
        };
      });

      return {
        ...otherFields,
        ...extensions,
        logo: logoImage,
        background: backgroundImage,
      };
    })
  );

  return json(
    { isLoggedIn, organizations, areas, offers },
    { headers: response.headers }
  );
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const {
    items,
    refCallback,
  }: {
    items: typeof loaderData.organizations;
    refCallback: (node: HTMLDivElement) => void;
  } = useInfiniteItems(
    loaderData.organizations,
    "/explore/organizations?",
    "organizations",
    searchParams
  );

  return (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Entdecke Organisationen</H1>
        <p className="">Hier findest du Organisationen und Netzwerke.</p>
      </section>
      <section
        ref={refCallback}
        // className="container my-8 md:my-10 lg:my-20"
        className="mv-w-full mv-mx-auto mv-px-4 mv-max-w-[600px] md:mv-max-w-[768px] lg:mv-max-w-[1120px] mv-mt-4 lg:mv-mt-10 mv-mb-12 lg:mv-mb-16"
        id="contact-details"
      >
        <div data-testid="grid" className="flex flex-wrap justify-center">
          {items.length > 0 ? (
            items.map((organization) => {
              return (
                <div
                  key={`organization-${organization.id}`}
                  data-testid="gridcell"
                  className="w-full md:w-1/2 lg:w-1/3 px-4 lg:px-4 mb-8"
                >
                  <OrganizationCard
                    publicAccess={!loaderData.isLoggedIn}
                    organization={organization}
                  />
                </div>
              );
            })
          ) : (
            <p>
              Für Deine Filterkriterien konnten leider keine Organisationen
              gefunden werden.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
