import { json, type DataFunctionArgs } from "@remix-run/node";
import { notFound } from "remix-utils";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { prismaClient } from "~/prisma.server";
import { deriveProfileMode } from "../utils.server";
import { invariantResponse } from "~/lib/utils/response";
import { useLoaderData } from "@remix-run/react";

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const username = getParamValueOrThrow(params, "username");
  const profile = await prismaClient.profile.findFirst({
    where: { username },
    select: {
      notificationSettings: true,
    },
  });
  if (profile === null) {
    throw notFound("Profile not found");
  }
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });
  return json({ profile });
};

function Notifications() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <>
      <h1 className="mv-mb-8">Benachrichtigungen</h1>
      {loaderData.profile.notificationSettings !== null ? (
        <ul>
          <li>
            <div className="mv-flex mv-justify-between">
              <p>Über Plattform-Updates informieren:</p>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={loaderData.profile.notificationSettings.updates}
              />
            </div>
          </li>
        </ul>
      ) : (
        "Keine Einstellungen gefunden."
      )}
    </>
  );
}

export default Notifications;
