import {
  Button,
  CardContainer,
  OrganizationCard,
} from "@mint-vernetzt/components";
import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import React from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma";
import { getAllOffers } from "~/profile.server";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
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

  const rawOrganizations = await getAllOrganizations({
    skip: skip,
    take: take,
    randomSeed: randomSeed,
  });

  const enhancedOrganizations = [];

  for (const organization of rawOrganizations) {
    let enhancedOrganization = {
      ...organization,
      teamMembers: await prismaClient.profile.findMany({
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
      }),
    };

    if (sessionUser === null) {
      // Filter organization
      enhancedOrganization = await filterOrganizationByVisibility<
        typeof enhancedOrganization
      >(enhancedOrganization);
      // Filter team members
      enhancedOrganization.teamMembers = await Promise.all(
        enhancedOrganization.teamMembers.map(async (profile) => {
          const filteredProfile = await filterProfileByVisibility<
            typeof profile
          >(profile);
          return { ...filteredProfile };
        })
      );
    }

    // Add images from image proxy
    if (enhancedOrganization.logo !== null) {
      const publicURL = getPublicURL(authClient, enhancedOrganization.logo);
      if (publicURL !== null) {
        enhancedOrganization.logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
          gravity: GravityType.center,
        });
      }
    }

    if (enhancedOrganization.background !== null) {
      const publicURL = getPublicURL(
        authClient,
        enhancedOrganization.background
      );
      if (publicURL !== null) {
        enhancedOrganization.background = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
          gravity: GravityType.center,
        });
      }
    }

    enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
      (profile) => {
        let avatar = profile.avatar;
        if (avatar !== null) {
          const publicURL = getPublicURL(authClient, avatar);
          avatar = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
          });
        }
        return { ...profile, avatar };
      }
    );

    enhancedOrganizations.push(enhancedOrganization);
  }

  return json(
    { isLoggedIn, organizations: enhancedOrganizations, areas, offers },
    { headers: response.headers }
  );
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const [items, setItems] = React.useState(loaderData.organizations);

  let page = 2;
  if (searchParams !== undefined) {
    const pageParam = searchParams.get("page");
    if (pageParam !== null) {
      page = parseInt(pageParam) + 1;
    }
  }

  React.useEffect(() => {
    if (
      fetcher.data !== undefined &&
      fetcher.data.organizations !== undefined
    ) {
      setItems((items) => [...items, ...fetcher.data.organizations]);
    }
  }, [fetcher.data]);

  return (
    <>
      <section className="container my-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Entdecke Organisationen</H1>
        <p className="">Hier findest du Organisationen und Netzwerke.</p>
      </section>
      <section
        // ref={refCallback}
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
        <fetcher.Form method="get">
          <input
            key="randomSeed"
            type="hidden"
            name="randomSeed"
            value={searchParams.get("randomSeed") || ""}
          />
          <input key="page" type="hidden" name="page" value={page} />
          <Button variant="outline" loading={fetcher.state === "loading"}>
            Mehr laden
          </Button>
        </fetcher.Form>
      </section>
    </>
  );
}
