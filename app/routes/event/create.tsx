import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { format, zonedTimeToUtc } from "date-fns-tz";
import { useForm } from "react-hook-form";
import { badRequest } from "remix-utils";
import type { InferType } from "yup";
import { date, object, string } from "yup";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
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
  const jsDate = new Date(date);
  const formattedDate = format(jsDate, "yyyy-MM-dd");
  let dateTime = zonedTimeToUtc(
    `${formattedDate} ${time || "".trimEnd()}`,
    "Europe/Berlin"
  );
  return dateTime;
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
  const navigate = useNavigate();
  const { register } = useForm<FormType>();

  return (
    <>
      <section className="container md:mt-2">
        <div className="font-semi text-neutral-600 flex items-center">
          {/* TODO: get back route from loader */}
          <button onClick={() => navigate(-1)} className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              className="h-auto w-6"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
              />
            </svg>
            <span className="ml-2">Zurück</span>
          </button>
        </div>
      </section>
      <div className="container relative pt-20 pb-44">
        <div className="flex -mx-4 justify-center">
          <div className="md:flex-1/2 px-4 pt-10 lg:pt-0">
            <h4 className="font-semibold">Veranstaltung anlegen</h4>
            <div className="pt-10 lg:pt-0">
              <Form method="post">
                <input name="userId" defaultValue={loaderData.id} hidden />
                <input name="child" defaultValue={loaderData.child} hidden />
                <input name="parent" defaultValue={loaderData.parent} hidden />
                <div className="mb-4">
                  <Input
                    id="name"
                    label="Name der Veranstaltung*"
                    {...register("name")}
                  />
                </div>
                <div className="mb-4">
                  {/* TODO: Date Input Component */}
                  <label htmlFor="startDate">Start Date*</label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    className="mx-2 border"
                    required
                  />
                </div>
                <div className="mb-4">
                  {/* TODO: Time Input Component */}
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    className="mx-2 border"
                  />
                </div>
                <div className="mb-4">
                  {/* TODO: Date Input Component */}
                  <label htmlFor="endDate">End Date</label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    className="mx-2 border"
                  />
                </div>
                <div className="mb-4">
                  {/* TODO: Time Input Component */}
                  <label htmlFor="endTime">End Time</label>
                  <input
                    id="endTime"
                    name="endTime"
                    type="time"
                    className="mx-2 border"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-outline-primary ml-auto btn-small mb-8"
                >
                  Anlegen
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
