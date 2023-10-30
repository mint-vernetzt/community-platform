import { redirect, type DataFunctionArgs, json } from "@remix-run/node";
import { useActionData, useLocation } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { z } from "zod";
import {
  blueSkySchema,
  facebookSchema,
  instagramSchema,
  linkedinSchema,
  mastodonSchema,
  twitterSchema,
  websiteSchema,
  xingSchema,
  youtubeSchema,
} from "~/lib/utils/schemas";
import { useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { redirectWithAlert } from "~/alert.server";
import { prismaClient } from "~/prisma.server";

const webSocialSchema = z.object({
  website: websiteSchema,
  facebook: facebookSchema,
  linkedin: linkedinSchema,
  xing: xingSchema,
  twitter: twitterSchema,
  mastodon: mastodonSchema,
  blueSky: blueSkySchema,
  instagram: instagramSchema,
  youtube: youtubeSchema,
});

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

  return null;
};

export async function action({ request, params }: DataFunctionArgs) {
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
  // Validation
  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: (intent) =>
      webSocialSchema.transform(async (data, ctx) => {
        if (intent !== "submit") return { ...data };
        try {
          // TODO: Investigate why typescript does not show an type error...
          const someData = { test: "", ...data };
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              ...someData,
            },
          });
        } catch (e) {
          console.warn(e);
          ctx.addIssue({
            code: "custom",
            message:
              "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support",
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }
  if (!submission.value) {
    return json({ status: "error", submission } as const, { status: 400 });
  }

  return redirectWithAlert(
    ".",
    {
      message: "Deine Änderungen wurden gespeichert.",
    },
    { status: 200 }
  );
}

function WebSocial() {
  const location = useLocation();

  const actionData = useActionData<typeof action>();

  const formId = "web-social-form";
  const [form, fields] = useForm({
    id: formId,
    constraint: getFieldsetConstraint(webSocialSchema),
    // defaultValue: { redirectTo },
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: webSocialSchema });
    },
  });

  return (
    <>
      <BackButton to={location.pathname}>
        Website und Soziale Netwerke
      </BackButton>
    </>
  );
}

export default WebSocial;
