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

  const organizations = rawOrganizations.map((organization) => {
    const { bio, publicFields, logo, ...otherFields } = organization;
    let extensions: { bio?: string } = {};

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

    return { ...otherFields, ...extensions, logo: logoImage };
  });

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
        className="container my-8 md:my-10 lg:my-20"
        id="contact-details"
      >
        <div
          ref={refCallback}
          data-testid="grid"
          className="flex flex-wrap justify-center -mx-4 items-stretch"
        >
          {items.length > 0 ? (
            items.map((organization) => {
              let slug, image, initials, name, subtitle;

              slug = `/organization/${organization.slug}`;
              image = organization.logo;
              initials = getInitialsOfName(organization.name);
              name = organization.name;
              subtitle = organization.organizationTypeTitles.join(" / ");

              return (
                <div
                  key={`organization-${organization.id}`}
                  data-testid="gridcell"
                  className="flex-100 md:flex-1/2 lg:flex-1/3 px-4 lg:px-4 mb-8"
                >
                  <Link
                    to={slug}
                    className="flex flex-wrap content-start items-start px-4 pt-4 lg:p-6 pb-8 rounded-3xl shadow h-full bg-neutral-200 hover:bg-neutral-400"
                  >
                    <div className="w-full flex flex-row">
                      {image !== null ? (
                        <div className="w-16 h-16 rounded-full shrink-0 overflow-hidden flex items-center justify-center border">
                          <img
                            className="max-w-full w-auto max-h-16 h-auto"
                            src={image}
                            alt={name}
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="pl-4">
                        <H3 like="h4" className="text-xl mb-1">
                          {name}
                        </H3>
                        {subtitle !== "" ? (
                          <p className="font-bold text-sm">{subtitle}</p>
                        ) : null}
                      </div>
                    </div>

                    {organization.bio !== undefined ? (
                      <p className="mt-3 line-clamp-2">{organization.bio}</p>
                    ) : null}

                    {organization.areaNames.length > 0 ? (
                      <div className="flex font-semibold flex-col lg:flex-row w-full mt-3">
                        <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                          Aktivitätsgebiete
                        </div>
                        <div className="flex-auto line-clamp-3">
                          <span>{organization.areaNames.join(" / ")}</span>
                        </div>
                      </div>
                    ) : null}
                  </Link>
                </div>
              );
            })
          ) : (
            <p>
              Für Deine Filterkriterien konnten leider keine Profile gefunden
              werden.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
