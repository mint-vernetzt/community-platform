import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
  useParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Hint from "~/components/next/Hint";
import { usePreviousLocation } from "~/components/next/PreviousLocationContext";
import { UnsavedChangesModal } from "~/components/next/UnsavedChangesModal";
import { useFormRevalidationAfterSuccess } from "~/lib/hooks/useFormRevalidationAfterSuccess";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { UnsavedChangesModalParam } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { getEventBySlug, updateEventBySlug } from "./change-url.server";
import { createChangeURLSchema } from "./change-url.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/danger-zone/change-url"
    ];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const baseURL = process.env.COMMUNITY_BASE_URL;

  return { locales, baseURL, event };
}

export async function action(args: ActionFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/danger-zone/change-url"
    ];

  const formData = await request.formData();
  const schema = createChangeURLSchema({ locales: locales.route });
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const stillExistingEvent = await getEventBySlug(submission.value.slug);
  if (stillExistingEvent !== null) {
    return redirectWithToast(request.url, {
      id: "change-url-error-existing-slug",
      key: `change-url-error-existing-slug-${Date.now()}`,
      message: insertParametersIntoLocale(
        locales.route.validation.slug.stillExisting,
        { slug: submission.value.slug }
      ),
      level: "negative",
    });
  }

  try {
    await updateEventBySlug(params.slug, submission.value);
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "change-url-error",
      key: `change-url-error-${Date.now()}`,
      message: locales.route.errors.updateFailed,
      level: "negative",
    });
  }

  const url = new URL(request.url);
  url.pathname = `/next/event/${submission.value.slug}/settings/danger-zone/change-url`;

  return redirectWithToast(url.toString(), {
    id: "change-url-success",
    key: `change-url-success-${Date.now()}`,
    message: locales.route.success,
    level: "positive",
  });
}

function ChangeURL() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { locales, baseURL } = loaderData;
  const params = useParams();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const navigation = useNavigation();
  const [form, fields] = useForm({
    id: "change-url-form",
    constraint: getZodConstraint(
      createChangeURLSchema({ locales: locales.route })
    ),
    defaultValue: {
      slug: loaderData.event.slug,
    },
    shouldValidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: createChangeURLSchema({ locales: locales.route }),
      });
    },
    lastResult: navigation.state === "idle" ? actionData : null,
  });

  const location = useLocation();
  const previousLocation = usePreviousLocation();
  useFormRevalidationAfterSuccess({
    deps: {
      navigation,
      actionData,
      form,
    },
    skipRevalidation:
      location.search.includes(UnsavedChangesModalParam) ||
      (previousLocation !== null &&
        previousLocation.search.includes(UnsavedChangesModalParam)),
    redirectToSameRouteOnDifferentURL: true,
  });

  return (
    <>
      <UnsavedChangesModal
        searchParam={UnsavedChangesModalParam}
        formMetadataToCheck={form}
        locales={locales.components.UnsavedChangesModal}
      />
      <p>
        {insertComponentsIntoLocale(
          insertParametersIntoLocale(locales.route.explanation, {
            baseURL: baseURL,
            slug: params.slug,
          }),
          [<span key="strong" className="font-semibold" />]
        )}
      </p>
      <Hint>
        {insertComponentsIntoLocale(locales.route.hint, [
          <span key="strong" className="font-semibold" />,
        ])}
      </Hint>
      <Form
        {...getFormProps(form)}
        method="post"
        preventScrollReset
        autoComplete="off"
      >
        <Input {...getInputProps(fields.slug, { type: "text" })} key="slug">
          <Input.Label htmlFor={fields.slug.id}>
            {locales.route.label}
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
      </Form>
      <div className="w-full flex flex-col md:flex-row md:justify-end gap-4">
        <div className="w-full flex flex-col md:flex-row-reverse gap-4">
          <div className="w-full md:w-fit">
            <Button
              type="submit"
              level="negative"
              fullSize
              form={form.id}
              // Don't disable button when js is disabled
              disabled={
                isHydrated
                  ? form.dirty === false || form.valid === false || isSubmitting
                  : false
              }
            >
              {locales.route.submit}
            </Button>
          </div>
          <div className="w-full md:w-fit">
            <div className="relative w-full">
              <Button
                type="reset"
                onClick={() => {
                  form.reset();
                }}
                variant="outline"
                fullSize
                // Don't disable button when js is disabled
                disabled={isHydrated ? form.dirty === false : false}
              >
                {locales.route.reset}
              </Button>
              <noscript className="absolute top-0">
                <Button as="link" to="." variant="outline" fullSize>
                  {locales.route.reset}
                </Button>
              </noscript>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChangeURL;
