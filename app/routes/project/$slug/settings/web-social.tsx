import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useBlocker,
  useLoaderData,
  useLocation,
} from "react-router";
import React from "react";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
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
import { detectLanguage } from "~/i18n.server";
import { redirectWithToast } from "~/toast.server";
import { BackButton } from "~/components-next/BackButton";
import {
  getRedirectPathOnProtectedProjectRoute,
  getHash,
} from "./utils.server";
import { Deep } from "~/lib/utils/searchParams";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { type ProjectWebAndSocialSettingsLocales } from "./web-social.server";
import { languageModuleMap } from "~/locales/.server";

const createWebSocialSchema = (locales: ProjectWebAndSocialSettingsLocales) =>
  z.object({
    website: createWebsiteSchema(locales),
    facebook: createFacebookSchema(locales),
    linkedin: createLinkedinSchema(locales),
    xing: createXingSchema(locales),
    twitter: createTwitterSchema(locales),
    mastodon: createMastodonSchema(locales),
    tiktok: createTiktokSchema(locales),
    instagram: createInstagramSchema(locales),
    youtube: createYoutubeSchema(locales),
  });

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/web-social"];
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invalidRoute,
    {
      status: 400,
    }
  );

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
  invariantResponse(project !== null, locales.route.error.projectNotFound, {
    status: 404,
  });

  return { project, locales };
};

export async function action({ request, params }: ActionFunctionArgs) {
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["project/$slug/settings/web-social"];

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invalidRoute,
    {
      status: 400,
    }
  );
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
  const webSocialSchema = createWebSocialSchema(locales);
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
            message: locales.route.error.custom,
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  const hash = getHash(submission);

  if (submission.intent !== "submit") {
    return { status: "idle", submission, hash };
  }
  if (!submission.value) {
    return { status: "error", submission, hash };
  }

  return redirectWithToast(request.url, {
    id: "change-project-web-and-social-toast",
    key: hash,
    message: locales.route.content.success,
  });
}

function WebSocial() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { project, locales } = loaderData;
  const actionData = useActionData<typeof action>();

  const formId = "web-social-form";
  const webSocialSchema = createWebSocialSchema(locales);
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
    const confirmed = confirm(locales.route.content.prompt);
    if (confirmed === true) {
      // TODO: fix blocker -> use org settings as blueprint
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
      <BackButton to={location.pathname}>
        {locales.route.content.back}
      </BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.intro}</p>
      <Form
        method="post"
        {...form.props}
        onChange={() => {
          setIsDirty(true);
        }}
        onSubmit={() => {
          setIsDirty(false);
        }}
        onReset={() => {
          setIsDirty(false);
        }}
      >
        {/* This button ensures submission via enter key. Always use a hidden button at top of the form when other submit buttons are inside it (f.e. the add/remove list buttons) */}
        <button type="submit" hidden />
        <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <Input name={Deep} defaultValue="true" type="hidden" />
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.form.website.headline}
            </h2>
            <Input
              {...conform.input(fields.website)}
              placeholder={locales.route.form.website.url.placeholder}
            >
              <Input.Label htmlFor={fields.website.id}>
                {locales.route.form.website.url.label}
              </Input.Label>
              {typeof fields.website.error !== "undefined" && (
                <Input.Error>{fields.website.error}</Input.Error>
              )}
            </Input>
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.form.socialNetworks.headline}
            </h2>
            <Input
              {...conform.input(fields.facebook)}
              placeholder={
                locales.route.form.socialNetworks.facebook.placeholder
              }
            >
              <Input.Label htmlFor={fields.facebook.id}>
                {locales.route.form.socialNetworks.facebook.label}
              </Input.Label>
              {typeof fields.facebook.error !== "undefined" && (
                <Input.Error>{fields.facebook.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.linkedin)}
              placeholder={
                locales.route.form.socialNetworks.linkedin.placeholder
              }
            >
              <Input.Label htmlFor={fields.linkedin.id}>
                {locales.route.form.socialNetworks.linkedin.label}
              </Input.Label>
              {typeof fields.linkedin.error !== "undefined" && (
                <Input.Error>{fields.linkedin.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.xing)}
              placeholder={locales.route.form.socialNetworks.xing.placeholder}
            >
              <Input.Label htmlFor={fields.xing.id}>
                {locales.route.form.socialNetworks.xing.label}
              </Input.Label>
              {typeof fields.xing.error !== "undefined" && (
                <Input.Error>{fields.xing.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.twitter)}
              placeholder={
                locales.route.form.socialNetworks.twitter.placeholder
              }
            >
              <Input.Label htmlFor={fields.twitter.id}>
                {locales.route.form.socialNetworks.twitter.label}
              </Input.Label>
              {typeof fields.twitter.error !== "undefined" && (
                <Input.Error>{fields.twitter.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.mastodon)}
              placeholder={
                locales.route.form.socialNetworks.mastodon.placeholder
              }
            >
              <Input.Label htmlFor={fields.mastodon.id}>
                {locales.route.form.socialNetworks.mastodon.label}
              </Input.Label>
              {typeof fields.mastodon.error !== "undefined" && (
                <Input.Error>{fields.mastodon.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.tiktok)}
              placeholder={locales.route.form.socialNetworks.tiktok.placeholder}
            >
              <Input.Label>
                {locales.route.form.socialNetworks.tiktok.label}
              </Input.Label>
              {typeof fields.tiktok.error !== "undefined" && (
                <Input.Error>{fields.tiktok.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.instagram)}
              placeholder={
                locales.route.form.socialNetworks.instagram.placeholder
              }
            >
              <Input.Label htmlFor={fields.instagram.id}>
                {locales.route.form.socialNetworks.instagram.label}
              </Input.Label>
              {typeof fields.instagram.error !== "undefined" && (
                <Input.Error>{fields.instagram.error}</Input.Error>
              )}
            </Input>
            <Input
              {...conform.input(fields.youtube)}
              placeholder={
                locales.route.form.socialNetworks.youtube.placeholder
              }
            >
              <Input.Label htmlFor={fields.youtube.id}>
                {locales.route.form.socialNetworks.youtube.label}
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
                  {locales.route.form.reset}
                </Button>

                <Button
                  type="submit"
                  fullSize
                  onClick={() => {
                    setIsDirty(false);
                  }}
                >
                  {locales.route.form.submit}
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
