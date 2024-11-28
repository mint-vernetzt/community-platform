import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button, Controls, Input, Section } from "@mint-vernetzt/components";
import {
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
import {
  checkboxSchema,
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
import { detectLanguage } from "~/root.server";
import { redirectWithToast } from "~/toast.server";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import {
  getOrganizationWebSocial,
  updateOrganizationWebSocial,
} from "./web-social.server";
import { getSubmissionHash } from "~/routes/project/$slug/settings/utils.server";
import { BackButton } from "~/routes/project/$slug/settings/__components";
import { VisibilityCheckbox } from "~/routes/__components";

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
    visibilities: z.object({
      website: checkboxSchema,
      facebook: checkboxSchema,
      linkedin: checkboxSchema,
      xing: checkboxSchema,
      twitter: checkboxSchema,
      mastodon: checkboxSchema,
      tiktok: checkboxSchema,
      instagram: checkboxSchema,
      youtube: checkboxSchema,
    }),
  });

const i18nNS = [
  "routes/next/organization/settings/web-social",
  "utils/schemas",
];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const organization = await getOrganizationWebSocial({ slug, t });

  return { organization };
};

export async function action({ request, params }: ActionFunctionArgs) {
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  // Validation
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      createWebSocialSchema(t).transform(async (data, ctx) => {
        console.log({ intent });
        if (intent === null || intent.type !== "validate") {
          console.log("No intent or not validate");
          return { ...data };
        }
        const { error } = await updateOrganizationWebSocial({
          slug,
          data,
        });
        if (error !== null) {
          console.log("Error updating organization", error);
          ctx.addIssue({
            code: "custom",
            message: t("error.updateFailed"),
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  console.log(
    "Submission",
    "value" in submission
      ? submission.value.visibilities
      : submission.payload.visibilities
  );

  if (submission.status !== "success") {
    console.log("Submission did not succeed");
    return { submission: submission.reply() };
  }

  const hash = getSubmissionHash(submission);

  return redirectWithToast(request.url, {
    id: "update-web-social-toast",
    key: hash,
    message: t("content.success"),
  });
}

function WebSocial() {
  const location = useLocation();
  const { t } = useTranslation(i18nNS);
  const { organization } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    id: "web-social-form",
    constraint: getZodConstraint(createWebSocialSchema(t)),
    defaultValue: {
      ...organization,
      visibilities: organization.organizationVisibility,
    },
    lastResult: actionData?.submission,
    shouldRevalidate: "onInput",
  });
  console.log({
    lastResult: actionData?.submission,
  });
  const visibilities = fields.visibilities.getFieldset();
  const isDirty = form.dirty;

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
      <Form {...getFormProps(form)} method="post" preventScrollReset>
        <button type="submit" hidden />
        <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            {/* TODO: Investigate if this is neccessary on post */}
            {/* <Input name={DeepSearchParam} defaultValue="true" type="hidden" /> */}
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("form.website.headline")}
            </h2>
            <Input
              // TODO: Check how type url behaves
              {...getInputProps(fields.website, { type: "url" })}
              placeholder={t("form.website.url.placeholder")}
            >
              <Input.Label htmlFor={fields.website.id}>
                {t("form.website.url.label")}
              </Input.Label>
              <Input.Controls>
                <VisibilityCheckbox
                  {...getInputProps(visibilities.website, {
                    type: "checkbox",
                  })}
                />
              </Input.Controls>
              {typeof fields.website.errors !== "undefined" &&
              fields.website.errors.length > 0
                ? fields.website.errors.map((error) => (
                    <Input.Error key={error}>{error}</Input.Error>
                  ))
                : null}
            </Input>
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {t("form.socialNetworks.headline")}
            </h2>
            {Object.entries(organization).map(([key]) => {
              const typedKey = key as keyof typeof organization;
              if (
                typedKey === "website" ||
                typedKey === "organizationVisibility"
              ) {
                return null;
              }
              return (
                <Input
                  {...getInputProps(fields[typedKey], { type: "url" })}
                  placeholder={t(`form.socialNetworks.${typedKey}.placeholder`)}
                  key={key}
                >
                  <Input.Label htmlFor={fields[typedKey].id}>
                    {t(`form.socialNetworks.${typedKey}.label`)}
                  </Input.Label>
                  <Input.Controls>
                    <VisibilityCheckbox
                      {...getInputProps(visibilities[typedKey], {
                        type: "checkbox",
                      })}
                    />
                  </Input.Controls>
                  {typeof fields[typedKey].errors !== "undefined" &&
                  fields[typedKey].errors.length > 0
                    ? fields[typedKey].errors.map((error) => (
                        <Input.Error key={error}>{error}</Input.Error>
                      ))
                    : null}
                </Input>
              );
            })}
          </div>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
              <Controls>
                {typeof form.errors !== "undefined" &&
                form.errors.length > 0 ? (
                  <div>
                    {form.errors.map((error, index) => {
                      return (
                        <div
                          key={index}
                          className="mv-text-sm mv-font-semibold mv-text-negative-600"
                        >
                          {error}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                <Button type="reset" variant="outline" fullSize>
                  {t("form.reset")}
                </Button>
                <Button
                  type="submit"
                  name="intent"
                  defaultValue="submit"
                  fullSize
                  disabled={!form.dirty}
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
