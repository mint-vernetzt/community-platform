import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  json,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { notFound } from "remix-utils";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { prismaClient } from "~/prisma.server";
import { deriveProfileMode } from "../utils.server";

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
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const username = getParamValueOrThrow(params, "username");
  const profile = await prismaClient.profile.findFirst({
    where: { username },
    select: {
      notificationSettings: true,
    },
  });
  if (profile === null) {
    throw notFound("Profile not found");
  }
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });

  const notificationSettings = profile.notificationSettings ?? {
    updates: false,
  };

  return json({ profile: { ...profile, notificationSettings } });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const username = getParamValueOrThrow(params, "username");
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });

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

  return json(submission, { headers: response.headers });
};

function Notifications() {
  const loaderData = useLoaderData<typeof loader>();
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
      <h1 className="mv-mb-8">Benachrichtigungen</h1>
      {loaderData.profile.notificationSettings !== null ? (
        <ul>
          <Form method="post" {...form.props}>
            <div className="mv-flex mv-justify-between">
              <label className="mv-font-semibold" htmlFor={fields.updates.name}>
                Ich möchte zu Plattform-Updates informiert werden.
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
                <Button variant="outline">Speichern</Button>
              </div>
            </noscript>
          </Form>
        </ul>
      ) : (
        "Keine Einstellungen gefunden."
      )}
    </>
  );
}

export default Notifications;
