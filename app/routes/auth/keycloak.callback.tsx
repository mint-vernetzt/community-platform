import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { createProfile, sendWelcomeMail } from "../register/utils.server";
import * as Sentry from "@sentry/remix";
import { generateValidSlug } from "~/utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient, headers } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    return redirect("/dashboard");
  }
  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.searchParams);
  const code = urlSearchParams.get("code");
  invariantResponse(code !== null, "Bad Request", { status: 400 });
  const { data, error } = await authClient.auth.exchangeCodeForSession(code);
  const { user } = data;
  invariantResponse(
    user !== null && error === null,
    "Server error during verification",
    { status: 500 }
  );
  // check if profile exists
  const profile = await prismaClient.profile.findFirst({
    where: { email: user.email },
    select: { id: true, username: true },
  });
  const firstLogin = profile === null;
  const loginRedirect = urlSearchParams.get("login_redirect");
  if (firstLogin) {
    const username = generateValidSlug(user.user_metadata.full_name);
    const fullNameParts = user.user_metadata.full_name.split(" ");
    // combine all parts except the last one to get the first name
    const firstName = fullNameParts.slice(0, -1).join(" ");
    // use the last part as last name
    const lastName = fullNameParts[fullNameParts.length - 1];

    // enhance user metadata to pass to createProfile condition
    user.user_metadata.username = username;
    user.user_metadata.firstName = firstName;
    user.user_metadata.lastName = lastName;
    user.user_metadata.termsAccepted = false;

    const profile = await createProfile(user);
    invariantResponse(
      profile !== null,
      "Did not provide necessary user meta data to create a corresponding profile after sign up.",
      { status: 400 }
    );
    sendWelcomeMail(profile).catch((error) => {
      Sentry.captureException(error);
    });
    return redirect(loginRedirect || `/profile/${profile.username}`, {
      headers,
    });
  }
  return redirect(loginRedirect || "/dashboard", {
    headers,
  });
};
