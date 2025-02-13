import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from "react-router";
import { Form, useActionData, useLoaderData, useSubmit } from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { prismaClient } from "~/prisma.server";
import { deriveProfileMode } from "../utils.server";
import { z } from "zod";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

const schema = z.object({
  updates: z
    .boolean()
    .optional()
    .transform((value) => {
      if (typeof value === "undefined") {
        return false;
      }
      return value;
    }),
});

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

  return { profile: { ...profile, notificationSettings }, locales };
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
  const submission = parse(formData, { schema });

  if (
    submission.intent === "submit" &&
    submission.value !== null &&
    typeof submission.value !== "undefined"
  ) {
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
  }

  return submission;
};

function Notifications() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [form, fields] = useForm({
    shouldValidate: "onInput",
    defaultValue: {
      updates: loaderData.profile.notificationSettings.updates ? "on" : "off",
    },
    onValidate: (args) => {
      const { formData } = args;
      const submission = parse(formData, { schema });
      if (Object.keys(submission.error).length === 0) {
        // if no errors change intent
        formData.set("__intent__", "submit");
        submit(formData, {
          method: "post",
        });
      }
      return submission;
    },
    lastSubmission: actionData,
  });

  return (
    <>
      <h1 className="mv-mb-8">{locales.content.headline}</h1>
      {loaderData.profile.notificationSettings !== null ? (
        <ul>
          <Form method="post" {...form.props}>
            <div className="mv-flex mv-justify-between">
              <label className="mv-font-semibold" htmlFor={fields.updates.name}>
                {locales.form.updates.label}
              </label>
              <input {...conform.input(fields.updates, { type: "checkbox" })} />
            </div>
            {fields.updates.error && (
              <div className="mv-text-negative-600 mv-text-sm">
                {fields.updates.error}
              </div>
            )}
            <noscript>
              <div className="mv-mt-2">
                <Button variant="outline">{locales.form.submit.label}</Button>
              </div>
            </noscript>
          </Form>
        </ul>
      ) : (
        <>{locales.content.empty}</>
      )}
    </>
  );
}

export default Notifications;
