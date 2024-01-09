import { type Organization, type Prisma } from "@prisma/client";
import { json, type DataFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function loader(args: DataFunctionArgs) {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  const url = new URL(request.url);

  if (sessionUser === null) {
    return redirect(`/login?login_redirect=${url.pathname}`, {
      headers: response.headers,
    });
  }

  const queryString = url.searchParams.get("search");
  const query = queryString !== null ? queryString.split(" ") : [];

  let searchResult: { name: string; slug: string; logo: string | null }[] = [];

  if (query.length > 0 && queryString !== null && queryString.length >= 3) {
    const whereQueries: {
      OR: {
        [K in Organization as string]: {
          contains: string;
          mode: Prisma.QueryMode;
        };
      }[];
    }[] = [];
    for (const word of query) {
      whereQueries.push({
        OR: [{ name: { contains: word, mode: "insensitive" } }],
      });
    }
    searchResult = await prismaClient.organization.findMany({
      where: {
        AND: whereQueries,
      },
      select: {
        name: true,
        slug: true,
        logo: true,
      },
      take: 5,
    });
    searchResult = searchResult.map((relation) => {
      let logo = relation.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return { ...relation, logo };
    });
  }

  return json({ searchResult }, { headers: response.headers });
}

function Create() {
  const loaderData = useLoaderData<typeof loader>();

  console.log(loaderData.searchResult);

  return null;
}

export default Create;
