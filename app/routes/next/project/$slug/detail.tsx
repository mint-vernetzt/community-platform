import { TabBar, TextButton } from "@mint-vernetzt/components";
import { json, type DataFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useMatches } from "@remix-run/react";

import { createAuthClient, getSessionUser } from "~/auth.server";
import { prismaClient } from "~/prisma.server";

export const loader = async (args: DataFunctionArgs) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  let username: string | null = null;

  if (sessionUser !== null) {
    const profile = await prismaClient.profile.findFirst({
      where: { id: sessionUser.id },
      select: { username: true },
    });
    if (profile !== null) {
      username = profile.username;
    }
  }

  return json({ username }, { headers: response.headers });
};

function ProjectDetail() {
  const loaderData = useLoaderData<typeof loader>();
  const matches = useMatches();
  let pathname = "";

  const lastMatch = matches[matches.length - 1];

  if (typeof lastMatch.pathname !== "undefined") {
    pathname = lastMatch.pathname;
  }

  return (
    <>
      {loaderData.username !== null && (
        <>
          <TextButton weight="thin" variant="neutral" arrowLeft>
            <Link
              to={`/profile/${loaderData.username}/#projects`}
              prefetch="intent"
            >
              Meine Projekte
            </Link>
          </TextButton>
        </>
      )}
      <h1>Project Detail</h1>
      <TabBar>
        <TabBar.Item active={pathname.endsWith("/about")}>
          <Link to="./about">about</Link>
        </TabBar.Item>
        <TabBar.Item active={pathname.endsWith("/requirements")}>
          <Link to="./requirements">requirements</Link>
        </TabBar.Item>
        <TabBar.Item active={pathname.endsWith("/attachments")}>
          <Link to="./attachments">attachments</Link>
        </TabBar.Item>
      </TabBar>
      <Link to="./../settings">⚙️</Link>
      <Outlet />
    </>
  );
}

export default ProjectDetail;
