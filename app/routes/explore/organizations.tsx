import { CardContainer, OrganizationCard } from "@mint-vernetzt/components";
import type { Profile } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
import type { ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma";
import { getAllOffers } from "~/profile.server";
import {
  filterOrganizationDataByVisibilitySettings,
  filterProfileDataByVisibilitySettings,
} from "~/public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import {
  getAllOrganizations,
  getPaginationValues,
  getRandomSeed,
} from "./utils.server";

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

  let rawOrganizations = await getAllOrganizations({
    skip: skip,
    take: take,
    randomSeed: randomSeed,
  });

  if (sessionUser === null) {
    rawOrganizations = await filterOrganizationDataByVisibilitySettings<
      ArrayElement<typeof rawOrganizations>
    >(rawOrganizations);
  }

  const organizations = await Promise.all(
    rawOrganizations.map(async (organization) => {
      const { logo, background, ...otherFields } = organization;

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

      let extensions: {
        id: string;
        teamMembers: Pick<
          Profile,
          "firstName" | "lastName" | "avatar" | "username" | "id"
        >[];
      } = { id: organization.id, teamMembers: [] };
      extensions.teamMembers = await prismaClient.profile.findMany({
        where: {
          memberOf: {
            some: {
              organizationId: organization.id,
            },
          },
        },
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
          username: true,
          id: true,
        },
      });

      if (sessionUser === null) {
        // Filter extensions
        const filteredExtensions = (
          await filterOrganizationDataByVisibilitySettings<typeof extensions>([
            extensions,
          ])
        )[0];
        extensions = filteredExtensions;
        // Filter team members of organization
        extensions.teamMembers = await filterProfileDataByVisibilitySettings<
          ArrayElement<typeof extensions.teamMembers>
        >(extensions.teamMembers);
      }

      extensions.teamMembers = extensions.teamMembers.map((teamMember) => {
        let avatarImage: string | null = null;
        if (teamMember.avatar !== null) {
          const publicURL = getPublicURL(authClient, teamMember.avatar);
          if (publicURL !== null) {
            avatarImage = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }

        return {
          id: teamMember.id,
          firstName: teamMember.firstName,
          lastName: teamMember.lastName,
          username: teamMember.username,
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
      <section className="container my-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Entdecke Organisationen</H1>
        <p className="">Hier findest du Organisationen und Netzwerke.</p>
      </section>
      <section
        ref={refCallback}
        className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl"
      >
        <CardContainer type="multi row">
          {items.length > 0 ? (
            items.map((organization) => {
              return (
                <OrganizationCard
                  key={`organization-${organization.id}`}
                  publicAccess={!loaderData.isLoggedIn}
                  organization={organization}
                />
              );
            })
          ) : (
            <p>
              Für Deine Filterkriterien konnten leider keine Profile gefunden
              werden.
            </p>
          )}
        </CardContainer>
      </section>
    </>
  );
}
