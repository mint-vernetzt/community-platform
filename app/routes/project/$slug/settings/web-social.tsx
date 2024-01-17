import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { Button, Controls, Input, Section } from "@mint-vernetzt/components";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import React from "react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { usePrompt } from "~/lib/hooks/usePrompt";
import { invariantResponse } from "~/lib/utils/response";
import {
  facebookSchema,
  instagramSchema,
  linkedinSchema,
  mastodonSchema,
  tiktokSchema,
  twitterSchema,
  websiteSchema,
  xingSchema,
  youtubeSchema,
} from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton } from "./__components";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "./utils.server";

const webSocialSchema = z.object({
  website: websiteSchema,
  facebook: facebookSchema,
  linkedin: linkedinSchema,
  xing: xingSchema,
  twitter: twitterSchema,
  mastodon: mastodonSchema,
  tiktok: tiktokSchema,
  instagram: instagramSchema,
  youtube: youtubeSchema,
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const { authClient, response } = createAuthClient(request);

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

  const project = await prismaClient.project.findUnique({
    select: {
      website: true,
      facebook: true,
      linkedin: true,
      xing: true,
      twitter: true,
      mastodon: true,
      tiktok: true,
      instagram: true,
      youtube: true,
    },
    where: {
      slug: params.slug,
    },
  });
  invariantResponse(project !== null, "Project not found", {
    status: 404,
  });

  return json(
    { project },
    {
      headers: response.headers,
    }
  );
};

export async function action({ request, params }: ActionFunctionArgs) {
  const { authClient, response } = createAuthClient(request);
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
        if (intent !== "submit") {
          return { ...data };
        }
        try {
          // TODO: Investigate why typescript does not show an type error...
          // const someData = { test: "", ...data };
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              // ...someData,
              ...data,
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

  const hash = getSubmissionHash(submission);

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission, hash } as const, {
      headers: response.headers,
    });
  }
  if (!submission.value) {
    return json({ status: "error", submission, hash } as const, {
      status: 400,
      headers: response.headers,
    });
  }

  return redirectWithToast(
    request.url,
    { id: "settings-toast", key: hash, message: "Daten gespeichert!" },
    { init: { headers: response.headers }, scrollToToast: true }
  );
}

function WebSocial() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { project } = loaderData;
  const actionData = useActionData<typeof action>();
  const formId = "web-social-form";
  const [form, fields] = useForm({
    id: formId,
    constraint: getFieldsetConstraint(webSocialSchema),
    defaultValue: {
      website: project.website || undefined,
      facebook: project.facebook || undefined,
      linkedin: project.linkedin || undefined,
      xing: project.xing || undefined,
      twitter: project.twitter || undefined,
      mastodon: project.mastodon || undefined,
      tiktok: project.tiktok || undefined,
      instagram: project.instagram || undefined,
      youtube: project.youtube || undefined,
    },
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: webSocialSchema });
    },
    shouldRevalidate: "onInput",
  });

  const [isDirty, setIsDirty] = React.useState(false);
  // TODO: When updating to remix v2 use "useBlocker()" hook instead to provide custom ui (Modal, etc...)
  // see https://remix.run/docs/en/main/hooks/use-blocker
  usePrompt(
    "Du hast ungespeicherte Änderungen. Diese gehen verloren, wenn Du jetzt einen Schritt weiter gehst.",
    isDirty
  );

  return (
    <Section>
      <BackButton to={location.pathname}>
        Website und Soziale Netwerke
      </BackButton>
      <p className="mv-my-6 md:mv-mt-0">
        Wo kann die Community mehr über Dein Projekt oder Bildungsangebot
        erfahren?
      </p>
      <Form
        method="post"
        {...form.props}
        onChange={() => {
          setIsDirty(true);
        }}
        onReset={() => {
          setIsDirty(false);
        }}
      >
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <Button type="submit" hidden />
        <div className="mv-flex mv-flex-col mv-gap-6 md:mv-gap-4">
          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <Input id="deep" defaultValue="true" type="hidden" />
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Website
            </h2>
            <Input
              {...conform.input(fields.website)}
              placeholder="domainname.tld"
            >
              <Input.Label htmlFor={fields.website.id}>URL</Input.Label>
              {typeof fields.website.error !== "undefined" && (
                <Input.Error>{fields.website.error}</Input.Error>
              )}
            </Input>
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 md:mv-p-4 md:mv-border md:mv-rounded-lg md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              Soziale Netzwerke
            </h2>
            <Input
              {...conform.input(fields.facebook)}
              placeholder="facebook.com/<name>"
            >
              <Input.Label htmlFor={fields.facebook.id}>Facebook</Input.Label>
              {typeof fields.facebook.error !== "undefined" && (
                <Input.Error>{fields.facebook.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.linkedin)}
              placeholder="linkedin.com/company/<name>" // TODO: Regex does not fit with this placeholder
            >
              <Input.Label htmlFor={fields.linkedin.id}>LinkedIn</Input.Label>
              {typeof fields.linkedin.error !== "undefined" && (
                <Input.Error>{fields.linkedin.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.xing)}
              placeholder="xing.com/pages/<name>" // TODO: Regex does not fit with this placeholder
            >
              <Input.Label htmlFor={fields.xing.id}>Xing</Input.Label>
              {typeof fields.xing.error !== "undefined" && (
                <Input.Error>{fields.xing.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.twitter)}
              placeholder="twitter.com/<name>"
            >
              <Input.Label htmlFor={fields.twitter.id}>X (Twitter)</Input.Label>
              {typeof fields.twitter.error !== "undefined" && (
                <Input.Error>{fields.twitter.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.mastodon)}
              placeholder="domainname.tld/@<name>" // TODO: Regex does not fit with this placeholder
            >
              <Input.Label htmlFor={fields.mastodon.id}>Mastodon</Input.Label>
              {typeof fields.mastodon.error !== "undefined" && (
                <Input.Error>{fields.mastodon.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.tiktok)}
              placeholder="tiktok.com/@<name>"
            >
              <Input.Label>tiktok</Input.Label>
              {typeof fields.tiktok.error !== "undefined" && (
                <Input.Error>{fields.tiktok.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.instagram)}
              placeholder="instagram.com/<name>"
            >
              <Input.Label htmlFor={fields.instagram.id}>Instagram</Input.Label>
              {typeof fields.instagram.error !== "undefined" && (
                <Input.Error>{fields.instagram.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.youtube)}
              placeholder="youtube.com/<name>"
            >
              <Input.Label htmlFor={fields.youtube.id}>YouTube</Input.Label>
              {typeof fields.youtube.error !== "undefined" && (
                <Input.Error>{fields.youtube.error}</Input.Error>
              )}
            </Input>
          </div>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full md:mv-max-w-fit lg:mv-w-auto mv-items-center mv-justify-center lg:mv-justify-end">
              <Controls>
                <Button type="reset" variant="outline" fullSize>
                  Änderungen verwerfen
                </Button>
                {/* TODO: Add diabled attribute. Note: I'd like to use a hook from kent that needs remix v2 here. see /app/lib/utils/hooks.ts  */}

                <Button
                  type="submit"
                  fullSize
                  onClick={() => {
                    setIsDirty(false);
                  }}
                >
                  Speichern
                </Button>
              </Controls>
            </div>
          </div>
        </div>
      </Form>
    </Section>
  );
}

export default WebSocial;
