import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button, Input } from "@mint-vernetzt/components";
import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { type TFunction } from "i18next";
import { Trans, useTranslation } from "react-i18next";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { Deep } from "~/lib/utils/searchParams";
import { redirectWithToast } from "~/toast.server";
import { useHydrated } from "remix-utils/use-hydrated";
import {
  i18nNS as i18nNSUnsavedChangesModal,
  useUnsavedChangesBlockerWithModal,
} from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import { getHash } from "~/lib/string/transform";

const i18nNS = [
  "routes/next/organization/settings/danger-zone/change-url",
  ...i18nNSUnsavedChangesModal,
];
export const handle = {
  i18n: i18nNS,
};

function createSchema(t: TFunction) {
  return z.object({
    slug: z
      .string()
      .min(3, t("validation.slug.min"))
      .max(50, t("validation.slug.max"))
      .regex(/^[-a-z0-9-]+$/i, t("validation.slug.regex")),
  });
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  return json({ slug, baseURL: process.env.COMMUNITY_BASE_URL });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  await checkFeatureAbilitiesOrThrow(authClient, ["next-organization-create"]);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, t("error.invalidRoute"), {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: createSchema(t).transform(async (data, ctx) => {
      const organization = await prismaClient.organization.findFirst({
        where: { slug: data.slug },
        select: {
          slug: true,
        },
      });
      if (organization !== null) {
        ctx.addIssue({
          code: "custom",
          message: t("validation.slug.unique"),
        });
        return z.NEVER;
      }

      return { ...data };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    console.log("Submission did not succeed");
    return {
      submission: submission.reply(),
    };
  }

  await prismaClient.organization.update({
    where: { slug: params.slug },
    data: { slug: submission.value.slug },
  });

  const url = new URL(request.url);
  const pathname = url.pathname.replace(params.slug, submission.value.slug);

  const hash = getHash(submission);

  return redirectWithToast(`${pathname}?${Deep}=true`, {
    id: "settings-toast",
    key: hash,
    message: t("content.feedback"),
  });
};

function ChangeURL() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();

  const { t } = useTranslation(i18nNS);

  const [form, fields] = useForm({
    id: `change-url-form-${getHash(loaderData)}`,
    defaultValue: {
      slug: loaderData.slug,
    },
    constraint: getZodConstraint(createSchema(t)),
    shouldValidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: createSchema(t),
      });
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const UnsavedChangesBlockerModal = useUnsavedChangesBlockerWithModal({
    searchParam: "modal-unsaved-changes",
    formMetadataToCheck: form,
  });

  return (
    <>
      {UnsavedChangesBlockerModal}
      <p>
        <Trans
          i18nKey="content.reach"
          ns={i18nNS}
          components={[
            <span key="current-organization-url" className="mv-break-all">
              {loaderData.baseURL}/organization/
              <strong>{loaderData.slug}</strong>
            </span>,
          ]}
        />
      </p>
      <p>{t("content.note")}</p>
      <Form
        {...getFormProps(form)}
        method="post"
        autoComplete="off"
        preventScrollReset
      >
        <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
          <Input
            {...getInputProps(fields.slug, { type: "text" })}
            key={"current-slug"}
          >
            <Input.Label htmlFor={fields.slug.id}>
              {t("content.label")}
            </Input.Label>
            {typeof fields.slug.errors !== "undefined" &&
            fields.slug.errors.length > 0
              ? fields.slug.errors.map((error) => (
                  <Input.Error id={fields.slug.errorId} key={error}>
                    {error}
                  </Input.Error>
                ))
              : null}
            {typeof form.errors !== "undefined" && form.errors.length > 0
              ? form.errors.map((error) => (
                  <Input.Error id={form.errorId} key={error}>
                    {error}
                  </Input.Error>
                ))
              : null}
          </Input>
          <div className="mv-flex mv-w-full mv-justify-end">
            <div className="mv-flex mv-shrink mv-w-full @md:mv-max-w-fit @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
              <Button
                type="submit"
                level="negative"
                fullSize
                disabled={
                  isHydrated
                    ? form.dirty === false || form.valid === false
                    : false
                }
              >
                {t("content.action")}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </>
  );
}

export default ChangeURL;
