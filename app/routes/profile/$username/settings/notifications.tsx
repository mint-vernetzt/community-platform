import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { json, type DataFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { notFound } from "remix-utils";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { prismaClient } from "~/prisma.server";
import { deriveProfileMode } from "../utils.server";
import { z } from "zod";
import { Button } from "@mint-vernetzt/components";

const schema = z.object({
  updates: z.preprocess((value) => {
    if (Array.isArray(value)) {
      return value.includes("on");
    }
    return value === "on";
  }, z.boolean()),
});

export const loader = async (args: DataFunctionArgs) => {
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

export const action = async (args: DataFunctionArgs) => {
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

function Option(props: React.HTMLProps<HTMLInputElement>) {
  return (
    <>
      <div className="mv-flex mv-justify-between">
        <label className="mv-font-semibold" htmlFor={props.name}>
          {props.label}:
        </label>
        <input
          id={`${props.name}-disable`}
          type="hidden"
          name={props.name}
          value="off"
        />
        <input
          id={props.name}
          type="checkbox"
          name={props.name}
          defaultChecked={props.checked}
        />
      </div>
      {props.children}
    </>
  );
}

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
            <Option
              name="updates"
              label="Über Plattform-Updates informieren"
              checked={loaderData.profile.notificationSettings.updates}
            >
              {fields.updates.error && (
                <div className="mv-text-negative-600 mv-text-sm">
                  {fields.updates.error}
                </div>
              )}
            </Option>
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
