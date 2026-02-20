import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { captureException } from "@sentry/node";
import { getZodConstraint } from "node_modules/@conform-to/zod/dist/default/constraint";
import { parseWithZod } from "node_modules/@conform-to/zod/dist/default/parse";
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
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Hint from "~/components/next/Hint";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { redirectWithToast } from "~/toast.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { deleteEventBySlug, getEventBySlug } from "./delete.server";
import { createDeleteSchema } from "./delete.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/danger-zone/delete"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event.published && event.canceled === false) {
    const url = new URL(request.url);
    url.pathname = `/next/event/${params.slug}/settings/danger-zone/change-url`;
    return redirect(url.toString());
  }

  return { locales, event };
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
    languageModuleMap[language]["next/event/$slug/settings/danger-zone/delete"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });
  invariantResponse(
    event.published === false || (event.published && event.canceled),
    "Event should be canceled before deletion",
    { status: 400 }
  );

  const formData = await request.formData();
  const schema = createDeleteSchema({
    locales: locales.route,
    name: event.name,
  });
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await deleteEventBySlug(params.slug);
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "delete-error",
      key: `delete-error-${Date.now()}`,
      message: locales.route.errors.deleteFailed,
      level: "negative",
    });
  }

  return redirectWithToast("/dashboard", {
    id: "delete-success",
    key: `delete-success-${Date.now()}`,
    message: insertParametersIntoLocale(locales.route.success, {
      eventName: event.name,
    }),
    level: "positive",
  });
}

function Delete() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { locales, event } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();

  const [form, fields] = useForm({
    id: "delete-form",
    constraint: getZodConstraint(
      createDeleteSchema({ locales: locales.route, name: event.name })
    ),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: createDeleteSchema({
          locales: locales.route,
          name: event.name,
        }),
      });
    },
    lastResult: navigation.state === "idle" ? actionData : null,
  });

  return (
    <>
      <p>
        {insertComponentsIntoLocale(
          insertParametersIntoLocale(locales.route.explanation, {
            eventName: event.name,
          }),
          [<span key="strong" className="font-semibold" />]
        )}
      </p>
      <Hint>
        {insertComponentsIntoLocale(locales.route.hint, [
          <span key="strong" className="font-semibold" />,
        ])}
      </Hint>
      <Form {...getFormProps(form)} method="post" autoComplete="off">
        <Input {...getInputProps(fields.name, { type: "text" })} key="slug">
          <Input.Label htmlFor={fields.name.id}>
            {locales.route.label}
          </Input.Label>
          {typeof fields.name.errors !== "undefined" &&
          fields.name.errors.length > 0
            ? fields.name.errors.map((error) => (
                <Input.Error id={fields.name.errorId} key={error}>
                  {error}
                </Input.Error>
              ))
            : null}
        </Input>
        <div className="w-full flex justify-end mt-8 lg:mt-4">
          <div className="w-full lg:w-fit">
            <Button
              type="submit"
              level="negative"
              fullSize
              form={form.id}
              // Don't disable button when js is disabled
              disabled={
                isHydrated ? form.valid === false || isSubmitting : false
              }
            >
              {locales.route.submit}
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}

export default Delete;
