import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { createAuthClient, getSession } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { createProfile } from "../register/utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient, headers } = createAuthClient(request);

  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.searchParams);

  // check if user is already logged in and redirect to dashboard or login_redirect
  const session = await getSession(authClient);
  if (session !== null) {
    return redirect("/dashboard");
  }
  const code = urlSearchParams.get("code");
  const loginRedirect = urlSearchParams.get("login_redirect");
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
  if (firstLogin) {
    const profile = await createProfile(user);
    if (profile === null) {
      throw json(
        "Did not provide necessary user meta data to create a corresponding profile after sign up.",
        { status: 400 }
      );
    }
    return redirect(loginRedirect || `/profile/${profile.username}`, {
      headers,
    });
  }
  return redirect(loginRedirect || "dashboard", {
    headers,
  });
};
