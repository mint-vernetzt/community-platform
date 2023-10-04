import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { json, type DataFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { notFound } from "remix-utils";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { prismaClient } from "~/prisma.server";
import { deriveProfileMode } from "../utils.server";
import { z } from "zod";

const schema = z.object({
  updates: z.preprocess((value) => {
    return value === "on";
  }, z.boolean()),
  // .boolean(),
  // .refine((value) => {
  //   console.log({ value });
  //   return value === "on" || value === "off";
  // })
  // .transform(),
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
  const { request } = args;
  const formData = await request.formData();

  const data = {};
  formData.forEach((value, key) => {
    console.log({ key, value });
    data[key] = value;
  });
  console.log({ data });
  return json({ data });
};

function Option(props: React.HTMLProps<HTMLInputElement>) {
  console.log("props", props);
  return (
    <div className="mv-flex mv-justify-between">
      <label htmlFor={props.name}>{props.label}:</label>
      <input
        id={`${props.name}-disable`}
        type="hidden"
        name={props.name}
        value="off"
      />
      <input
        id={props.name}
        type="checkbox"
        // className="toggle toggle-checkbox"
        name={props.name}
        defaultChecked={props.checked}
      />
    </div>
  );
}

function Notifications() {
  const loaderData = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [form, fields] = useForm({
    shouldValidate: "onInput",
    defaultValue: {
      updates: loaderData.profile.notificationSettings.updates ? "on" : "off",
    },
    onValidate({ formData }) {
      const submission = parse(formData, { schema });
      formData.set("__intent__", "submit");
      submit(formData, {
        method: "post",
      });
      return submission;
    },
  });

  console.log("fields.updates", fields.updates);

  // const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();
  //   console.log(event.target);
  //   console.log(event.target.values);
  // };

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
              // checked={loaderData.profile.notificationSettings.updates}
            />
            {/* <label htmlFor="updates">Über Plattform-Updates informieren:</label>
            <input
            id="updates"
            type="checkbox"
              name="updates"
            /> */}
            {/* <li>
              <div className="mv-flex mv-justify-between">
              </div>
            </li> */}
          </Form>
        </ul>
      ) : (
        "Keine Einstellungen gefunden."
      )}
    </>
  );
}

export default Notifications;
