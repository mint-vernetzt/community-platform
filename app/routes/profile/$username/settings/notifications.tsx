import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import { Checkbox } from "~/components-next/Checkbox";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { redirectWithToast } from "~/toast.server";
import { deriveProfileMode } from "../utils.server";
import { schema } from "./notifications.shared";
import { getFormPersistenceTimestamp } from "~/utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/notifications"];
  const { authClient } = createAuthClient(request);
  const username = getParamValueOrThrow(params, "username");
  const profile = await prismaClient.profile.findFirst({
    where: { username },
    select: {
      notificationSettings: true,
    },
  });
  if (profile === null) {
    invariantResponse(false, locales.error.profileNotFound, { status: 404 });
  }
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", locales.error.notPrivileged, {
    status: 403,
  });

  const notificationSettings = profile.notificationSettings ?? {
    updates: false,
  };

  const currentTimestamp = getFormPersistenceTimestamp();

  return {
    profile: { ...profile, notificationSettings },
    locales,
    currentTimestamp,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/notifications"];
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const username = getParamValueOrThrow(params, "username");
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", locales.error.notPrivileged, {
    status: 403,
  });

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status === "success") {
    await prismaClient.profile.update({
      where: {
        id: sessionUser.id,
      },
      data: {
        notificationSettings: {
          update: {
            ...submission.value,
          },
        },
      },
    });
    return redirectWithToast(request.url, {
      id: "notifications-success",
      key: `notifications-success-${Date.now()}`,
      message: locales.success,
    });
  }

  return submission.reply();
};

function Notifications() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [form, fields] = useForm({
    id: `notifications-form-${currentTimestamp}`,
    constraint: getZodConstraint(schema),
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      updates: loaderData.profile.notificationSettings.updates,
    },
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, { schema });
      return submission;
    },
    lastResult: navigation.state === "idle" ? actionData : undefined,
  });

  return (
    <>
      <h1 className="mb-8">{locales.content.headline}</h1>
      {loaderData.profile.notificationSettings !== null ? (
        <div>
          <Form
            {...getFormProps(form)}
            method="post"
            preventScrollReset
            replace
            autoComplete="off"
          >
            <div className="flex gap-2 items-center">
              <Checkbox
                {...getInputProps(fields.updates, {
                  type: "checkbox",
                })}
                key="updates"
                onClick={(event) => {
                  event.preventDefault();
                  void submit(event.currentTarget.form, {
                    preventScrollReset: true,
                    replace: true,
                  });
                }}
              />
              <label htmlFor={fields.updates.id}>
                {locales.form.updates.label}
              </label>
            </div>
            <noscript>
              <div className="mt-2">
                <Button variant="outline">{locales.form.submit.label}</Button>
              </div>
            </noscript>
            {typeof fields.updates.errors !== "undefined" &&
            fields.updates.errors.length > 0 ? (
              <div className="mb-10 ml-5">
                {fields.updates.errors.map((error, index) => {
                  return (
                    <div
                      id={fields.updates.errorId}
                      key={index}
                      className="text-sm font-semibold text-negative-700"
                    >
                      {error}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </Form>
        </div>
      ) : (
        <>{locales.content.empty}</>
      )}
    </>
  );
}

export default Notifications;
