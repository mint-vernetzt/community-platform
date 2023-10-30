import { redirect, type DataFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useLocation } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { H2 } from "~/components/Heading/Heading";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { getImageURL } from "~/images.server";
import { GravityType } from "imgproxy/dist/types";
import { Avatar, List } from "@mint-vernetzt/components";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

  const project = await prismaClient.project.findFirst({
    where: { slug: params.slug },
    include: {
      teamMembers: {
        select: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
      admins: {
        select: {
          profile: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  invariantResponse(project !== null, "No found", {
    status: 404,
  });

  console.log(project);
  project.teamMembers = project.teamMembers.map((relation) => {
    let avatar = relation.profile.avatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return { profile: { ...relation.profile, avatar } };
  });

  return json({ project }, { headers: response.headers });
};

function Team() {
  const { project } = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <>
      <BackButton to={location.pathname}>Team verwalten</BackButton>
      <p>Füge Teammitglieder zu Deinem Projekt hinzu oder entferne sie.</p>
      <H2 as="h4">Aktuelle Teammitglieder</H2>
      <p>Teammitglieder und Rollen sind hier aufgelistet.</p>
      <List>
        {project.teamMembers.map((teamMember) => {
          return (
            <List.Item key={teamMember.profile.username}>
              <Avatar {...teamMember.profile} />
              <List.Item.Title>
                {teamMember.profile.firstName} {teamMember.profile.lastName}
              </List.Item.Title>
              <List.Item.Subtitle>
                {project.admins.some((admin) => {
                  return admin.profile.username === teamMember.profile.username;
                })
                  ? "Administrator:in"
                  : "Teammitglied"}
              </List.Item.Subtitle>
            </List.Item>
          );
        })}
      </List>
      <H2 as="h4">Teammitglied hinzufügen</H2>
    </>
  );
}

export default Team;
