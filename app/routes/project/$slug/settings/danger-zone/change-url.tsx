import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { Deep, LastTimeStamp } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedProjectRoute } from "../utils.server";
import { createSchema } from "./change-url.shared";
import { getFormPersistenceTimestamp } from "~/utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params, request } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "project/$slug/settings/danger-zone/change-url"
    ];

  const url = new URL(request.url);
  const lastTimeStampParam = url.searchParams.get(LastTimeStamp);
  const currentTimestamp = getFormPersistenceTimestamp(lastTimeStampParam);

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
      "project/$slug/settings/danger-zone/change-url"
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

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
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
      const project = await prismaClient.project.findFirst({
        where: { slug: data.slug },
        select: {
          slug: true,
        },
      });
      if (project !== null) {
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
    return submission.reply();
  }

  await prismaClient.project.update({
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
    id: `change-url-form-${loaderData.currentTimestamp}`,
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
    lastResult: navigation.state === "idle" ? actionData : null,
  });

  const UnsavedChangesBlockerModal = useUnsavedChangesBlockerWithModal({
    lastTimeStamp: loaderData.currentTimestamp,
    searchParam: "modal-unsaved-changes",
    formMetadataToCheck: form,
    locales: locales.components.UnsavedChangesModal,
  });

  return (
    <>
      {UnsavedChangesBlockerModal}
      <p>
        {insertComponentsIntoLocale(
          insertParametersIntoLocale(locales.route.content.reach, {
            url: `${loaderData.baseURL}/project/`,
            slug: loaderData.slug,
          }),
          [
            <span key="current-project-url" className="break-all" />,
            <strong key="current-project-slug" />,
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
          </Input>
          {typeof form.errors !== "undefined" && form.errors.length > 0 ? (
            <div>
              {form.errors.map((error) => {
                return (
                  <div
                    id={form.errorId}
                    key={form.errorId}
                    className="text-sm font-semibold text-negative-700"
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
