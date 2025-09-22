import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { Deep } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { redirectWithToast } from "~/toast.server";
import { type ChangeOrganizationUrlLocales } from "./change-url.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";

function createSchema(locales: ChangeOrganizationUrlLocales) {
  return z.object({
    slug: z
      .string()
      .min(3, locales.route.validation.slug.min)
      .max(50, locales.route.validation.slug.max)
      .regex(/^[-a-z0-9-]+$/i, locales.route.validation.slug.regex),
  });
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { params, request } = args;
  const slug = getParamValueOrThrow(params, "slug");
  const currentTimestamp = new Date().getTime();

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "organization/$slug/settings/danger-zone/change-url"
    ];

  return {
    slug,
    currentTimestamp,
    baseURL: process.env.COMMUNITY_BASE_URL,
    locales,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "organization/$slug/settings/danger-zone/change-url"
    ];

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
    schema: createSchema(locales).transform(async (data, ctx) => {
      const organization = await prismaClient.organization.findFirst({
        where: { slug: data.slug },
        select: {
          slug: true,
        },
      });
      if (organization !== null) {
        ctx.addIssue({
          code: "custom",
          message: locales.route.validation.slug.unique,
        });
        return z.NEVER;
      }

      return { ...data };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      currentTimestamp: Date.now(),
      submission: submission.reply(),
    };
  }

  await prismaClient.organization.update({
    where: { slug: params.slug },
    data: { slug: submission.value.slug },
  });

  const url = new URL(request.url);
  const pathname = url.pathname.replace(params.slug, submission.value.slug);

  return redirectWithToast(`${pathname}?${Deep}=true`, {
    id: "change-url-toast",
    key: `${new Date().getTime()}`,
    message: locales.route.content.feedback,
  });
};

function ChangeURL() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();

  const [form, fields] = useForm({
    id: `change-url-form-${
      actionData?.currentTimestamp || loaderData.currentTimestamp
    }`,
    defaultValue: {
      slug: loaderData.slug,
    },
    constraint: getZodConstraint(createSchema(locales)),
    shouldValidate: "onBlur",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: createSchema(locales),
      });
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  const UnsavedChangesBlockerModal = useUnsavedChangesBlockerWithModal({
    searchParam: "modal-unsaved-changes",
    formMetadataToCheck: form,
    locales,
  });

  return (
    <>
      {UnsavedChangesBlockerModal}
      <p>
        {insertComponentsIntoLocale(
          insertParametersIntoLocale(locales.route.content.reach, {
            url: `${loaderData.baseURL}/organization/`,
            slug: loaderData.slug,
          }),
          [
            <span key="current-organization-url" className="break-all" />,
            <strong key="current-organization-slug" />,
          ]
        )}
      </p>
      <p>{locales.route.content.note}</p>
      <Form
        {...getFormProps(form)}
        method="post"
        autoComplete="off"
        preventScrollReset
      >
        <div className="flex flex-col gap-4 @md:p-4 @md:border @md:rounded-lg @md:border-gray-200">
          <Input
            {...getInputProps(fields.slug, { type: "text" })}
            key={"current-slug-input"}
          >
            <Input.Label htmlFor={fields.slug.id}>
              {locales.route.content.label}
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
          {typeof form.errors !== "undefined" && form.errors.length > 0 ? (
            <div>
              {form.errors.map((error) => {
                return (
                  <div
                    id={form.errorId}
                    key={form.errorId}
                    className="text-sm font-semibold text-negative-600"
                  >
                    {error}
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="flex w-full justify-end">
            <div className="flex shrink w-full @md:max-w-fit @lg:w-auto items-center justify-center @lg:justify-end">
              <Button
                type="submit"
                level="negative"
                fullSize
                disabled={
                  isHydrated
                    ? form.dirty === false ||
                      form.valid === false ||
                      isSubmitting
                    : false
                }
              >
                {locales.route.content.action}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </>
  );
}

export default ChangeURL;
