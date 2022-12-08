import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { badRequest } from "remix-utils";
import type { InferType } from "yup";
import { date, object, string } from "yup";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { validateFeatureAccess } from "~/lib/utils/application";
import type { FormError } from "~/lib/utils/yup";
import { getFormValues, nullOrString, validateForm } from "~/lib/utils/yup";
import { generateEventSlug } from "~/utils";
import { checkIdentityOrThrow, createEventOnProfile } from "./utils.server";

const schema = object({
  userId: string().uuid().required(),
  name: string().required("Please add event name"),
  startDate: date()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    })
    .nullable()
    .required("Please add a start date"),
  startTime: nullOrString(string()),
  endDate: date()
    .nullable()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    })
    .defined(),
  endTime: nullOrString(string()),
  child: nullOrString(string()),
  parent: nullOrString(string()),
});

type SchemaType = typeof schema;
type FormType = InferType<typeof schema>;

type LoaderData = {
  id: string;
  child: string;
  parent: string;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const url = new URL(request.url);
  const child = url.searchParams.get("child") || "";
  const parent = url.searchParams.get("parent") || "";

  await validateFeatureAccess(authClient, "events");

  return json<LoaderData>(
    { id: sessionUser.id, child, parent },
    { headers: response.headers }
  );
};

function getDateTime(date: Date, time: string | null) {
  if (time === null) {
    const copy = new Date(date.getTime());
    copy.setHours(0);
    copy.setMinutes(0);
    copy.setSeconds(0);
    copy.setMilliseconds(0);
    return copy;
  }
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hoursAndMinutes = time.split(":").map(Number);
  return new Date(year, month, day, hoursAndMinutes[0], hoursAndMinutes[1]);
}

type ActionData = {
  data: FormType;
  errors: FormError | null;
};

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkIdentityOrThrow(request, sessionUser);

  let parsedFormData = await getFormValues<SchemaType>(request, schema);

  let errors: FormError | null;
  let data: FormType;

  try {
    let result = await validateForm<SchemaType>(schema, parsedFormData);
    errors = result.errors;
    data = result.data;
  } catch (error) {
    throw badRequest({ message: "Validation failed" });
  }

  if (errors === null) {
    const slug = generateEventSlug(data.name);
    const startTime = getDateTime(data.startDate, data.startTime);

    let endTime;
    if (data.endDate !== null) {
      endTime = getDateTime(data.endDate, data.endTime);
    } else {
      endTime = startTime;
    }

    await createEventOnProfile(
      sessionUser.id,
      {
        slug,
        name: data.name,
        startTime,
        endTime,
        participationUntil: startTime,
      },
      { child: data.child, parent: data.parent }
    );
    return redirect(`/event/${slug}`, { headers: response.headers });
  }

  return json<ActionData>({ data, errors }, { headers: response.headers });
};

export default function Create() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <Form method="post">
      <h1>create event</h1>
      <input name="userId" defaultValue={loaderData.id} hidden />
      <input name="child" defaultValue={loaderData.child} hidden />
      <input name="parent" defaultValue={loaderData.parent} hidden />
      <div className="m-2">
        <label htmlFor="name">Name*</label>
        <input
          id="name"
          name="name"
          type="text"
          className="mx-2 border"
          required
        />
      </div>
      <div className="m-2">
        <label htmlFor="startDate">Start Date*</label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          className="mx-2 border"
          required
        />
        <label htmlFor="startTime">Start Time</label>
        <input
          id="startTime"
          name="startTime"
          type="time"
          className="mx-2 border"
        />
      </div>
      <div className="m-2">
        <label htmlFor="endDate">End Date</label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          className="mx-2 border"
        />
        <label htmlFor="endTime">End Time</label>
        <input
          id="endTime"
          name="endTime"
          type="time"
          className="mx-2 border"
        />
      </div>
      <div className="m-2">
        <button className="btn btn-primary" type="submit">
          Submit
        </button>
      </div>
    </Form>
  );
}
