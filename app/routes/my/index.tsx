import { redirect, type LoaderFunctionArgs } from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";

// handle "/profile/$username" as default route
export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const profile = await prismaClient.profile.findUnique({
    select: { username: true },
    where: { id: sessionUser.id },
  });
  invariantResponse(profile !== null, "Profile not found", { status: 404 });
  return redirect(`/profile/${profile.username}`);
};
