import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { Button, Controls, Input, Section } from "@mint-vernetzt/components";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useBlocker,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { type TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import {
  createFacebookSchema,
  createInstagramSchema,
  createLinkedinSchema,
  createMastodonSchema,
  createTiktokSchema,
  createTwitterSchema,
  createWebsiteSchema,
  createXingSchema,
  createYoutubeSchema,
} from "~/lib/utils/schemas";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton } from "./__components";
import {
  getRedirectPathOnProtectedProjectRoute,
  getSubmissionHash,
} from "./utils.server";

const createWebSocialSchema = (t: TFunction) =>
  z.object({
    website: createWebsiteSchema(t),
    facebook: createFacebookSchema(t),
    linkedin: createLinkedinSchema(t),
    xing: createXingSchema(t),
    twitter: createTwitterSchema(t),
    mastodon: createMastodonSchema(t),
    tiktok: createTiktokSchema(t),
    instagram: createInstagramSchema(t),
    youtube: createYoutubeSchema(t),
  });

const i18nNS = ["routes/project/settings/web-social", "utils/schemas"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
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
  invariantResponse(project !== null, t("error.projectNotFound"), {
    status: 404,
  });

  return json({ project });
};

export async function action({ request, params }: ActionFunctionArgs) {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });
  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  // Validation
  const webSocialSchema = createWebSocialSchema(t);
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
            message: t("error.custom"),
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  const hash = getSubmissionHash(submission);

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission, hash } as const);
  }
  if (!submission.value) {
    return json({ status: "error", submission, hash } as const, {
      status: 400,
    });
  }

  return redirectWithToast(
    request.url,
    { id: "settings-toast", key: hash, message: t("content.success") },
    { scrollToToast: true }
  );
}

function WebSocial() {
  const location = useLocation();
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();
  const { project } = loaderData;
  const actionData = useActionData<typeof action>();

  const formId = "web-social-form";
  const webSocialSchema = createWebSocialSchema(t);
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
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );
  if (blocker.state === "blocked") {
    const confirmed = confirm(t("content.prompt"));
    if (confirmed === true) {
      // @ts-ignore - The blocker type may not be correct. Sentry logged an error that claims invalid blocker state transition from proceeding to proceeding
      if (blocker.state !== "proceeding") {
        blocker.proceed();
      }
    } else {
      blocker.reset();
    }
  }

  return (
    <Section>
      <BackButton to={location.pathname}>{t("content.back")}</BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{t("content.intro")}</p>
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
        <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <Input id="deep" defaultValue="true" type="hidden" />
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("form.website.headline")}
            </h2>
            <Input
              {...conform.input(fields.website)}
              placeholder={t("form.website.url.placeholder")}
            >
              <Input.Label htmlFor={fields.website.id}>
                {t("form.website.url.label")}
              </Input.Label>
              {typeof fields.website.error !== "undefined" && (
                <Input.Error>{fields.website.error}</Input.Error>
              )}
            </Input>
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("form.socialNetworks.headline")}
            </h2>
            <Input
              {...conform.input(fields.facebook)}
              placeholder={t("form.socialNetworks.facebook.placeholder")}
            >
              <Input.Label htmlFor={fields.facebook.id}>
                {t("form.socialNetworks.facebook.label")}
              </Input.Label>
              {typeof fields.facebook.error !== "undefined" && (
                <Input.Error>{fields.facebook.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.linkedin)}
              placeholder={t("form.socialNetworks.linkedin.placeholder")} // TODO: Regex does not fit with this placeholder
            >
              <Input.Label htmlFor={fields.linkedin.id}>
                {t("form.socialNetworks.linkedin.label")}
              </Input.Label>
              {typeof fields.linkedin.error !== "undefined" && (
                <Input.Error>{fields.linkedin.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.xing)}
              placeholder={t("form.socialNetworks.xing.placeholder")} // TODO: Regex does not fit with this placeholder
            >
              <Input.Label htmlFor={fields.xing.id}>
                {t("form.socialNetworks.xing.label")}
              </Input.Label>
              {typeof fields.xing.error !== "undefined" && (
                <Input.Error>{fields.xing.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.twitter)}
              placeholder={t("form.socialNetworks.twitter.placeholder")}
            >
              <Input.Label htmlFor={fields.twitter.id}>
                {t("form.socialNetworks.twitter.label")}
              </Input.Label>
              {typeof fields.twitter.error !== "undefined" && (
                <Input.Error>{fields.twitter.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.mastodon)}
              placeholder={t("form.socialNetworks.mastodon.placeholder")} // TODO: Regex does not fit with this placeholder
            >
              <Input.Label htmlFor={fields.mastodon.id}>
                {t("form.socialNetworks.mastodon.label")}
              </Input.Label>
              {typeof fields.mastodon.error !== "undefined" && (
                <Input.Error>{fields.mastodon.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.tiktok)}
              placeholder={t("form.socialNetworks.tiktok.placeholder")}
            >
              <Input.Label>{t("form.socialNetworks.tiktok.label")}</Input.Label>
              {typeof fields.tiktok.error !== "undefined" && (
                <Input.Error>{fields.tiktok.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.instagram)}
              placeholder={t("form.socialNetworks.instagram.placeholder")}
            >
              <Input.Label htmlFor={fields.instagram.id}>
                {t("form.socialNetworks.instagram.label")}
              </Input.Label>
              {typeof fields.instagram.error !== "undefined" && (
                <Input.Error>{fields.instagram.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.youtube)}
              placeholder={t("form.socialNetworks.youtube.placeholder")}
            >
              <Input.Label htmlFor={fields.youtube.id}>
                {t("form.socialNetworks.youtube.label")}
              </Input.Label>
              {typeof fields.youtube.error !== "undefined" && (
                <Input.Error>{fields.youtube.error}</Input.Error>
              )}
            </Input>
          </div>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
              <Controls>
                <Button type="reset" variant="outline" fullSize>
                  {t("form.reset")}
                </Button>
                {/* TODO: Add disabled attribute. Note: I'd like to use a hook from kent that needs remix v2 here. see /app/lib/utils/hooks.ts  */}

                <Button
                  type="submit"
                  fullSize
                  onClick={() => {
                    setIsDirty(false);
                  }}
                >
                  {t("form.submit")}
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
