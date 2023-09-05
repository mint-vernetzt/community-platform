import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { format } from "date-fns-tz";
import { useForm } from "react-hook-form";
import { badRequest } from "remix-utils";
import type { InferType } from "yup";
import { object, string } from "yup";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import type { FormError } from "~/lib/utils/yup";
import {
  getFormValues,
  greaterThanDate,
  greaterThanTimeOnSameDate,
  nullOrString,
  validateForm,
} from "~/lib/utils/yup";
import { generateEventSlug } from "~/utils.server";
import { validateTimePeriods } from "./$slug/settings/utils.server";
import { getEventById } from "./create.server";
import { createEventOnProfile, transformFormToEvent } from "./utils.server";

const schema = object({
  name: string().required("Bitte einen Veranstaltungsnamen angeben"),
  startDate: string()
    .transform((value) => {
      value = value.trim();
      try {
        const date = new Date(value);
        return format(date, "yyyy-MM-dd");
      } catch (error) {
        console.log(error);
      }
      return undefined;
    })
    .required("Bitte gib den Beginn der Veranstaltung an"),
  startTime: string().required("Bitte eine Startzeit angeben"),
  endDate: greaterThanDate(
    "endDate",
    "startDate",
    "Bitte gib das Ende der Veranstaltung an",
    "Das Enddatum darf nicht vor dem Startdatum liegen"
  ),
  endTime: greaterThanTimeOnSameDate(
    "endTime",
    "startTime",
    "startDate",
    "endDate",
    "Bitte gib das Ende der Veranstaltung an",
    "Die Veranstaltung findet an einem Tag statt. Dabei darf die Startzeit nicht nach der Endzeit liegen"
  ),
  child: nullOrString(string()),
  parent: nullOrString(string()),
});

type SchemaType = typeof schema;
type FormType = InferType<typeof schema>;

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await getSessionUserOrThrow(authClient);

  const url = new URL(request.url);
  const child = url.searchParams.get("child") || "";
  const parent = url.searchParams.get("parent") || "";

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  return json({ child, parent }, { headers: response.headers });
};

export const action = async (args: ActionArgs) => {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);

  let parsedFormData = await getFormValues<SchemaType>(request, schema);

  let errors: FormError | null;
  let data;

  try {
    let result = await validateForm<SchemaType>(schema, parsedFormData);
    errors = result.errors;
    data = result.data;
  } catch (error) {
    throw badRequest({ message: "Validation failed" });
  }

  const eventData = transformFormToEvent(data);
  // Time Period Validation
  // startTime and endTime of this event is in the boundary of parentEvents startTime and endTime
  // startTime and endTime of all childEvents is in the boundary of this event
  // Did not add this to schema as it is much more code and worse to read
  if (data.parent !== null) {
    const parentEvent = await getEventById(data.parent);
    errors = validateTimePeriods(eventData, parentEvent, [], errors);
  }
  if (errors === null) {
    const slug = generateEventSlug(data.name);

    await createEventOnProfile(
      sessionUser.id,
      {
        slug,
        name: eventData.name,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        participationUntil: eventData.participationUntil,
        participationFrom: eventData.participationFrom,
      },
      { child: eventData.child, parent: eventData.parent }
    );
    return redirect(`/event/${slug}`, { headers: response.headers });
  }
  return json({ data, errors }, { headers: response.headers });
};

export default function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
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
                <input name="child" defaultValue={loaderData.child} hidden />
                <input name="parent" defaultValue={loaderData.parent} hidden />
                <div className="mb-2">
                  <Input
                    id="name"
                    label="Name der Veranstaltung"
                    required
                    {...register("name")}
                    errorMessage={actionData?.errors?.name?.message}
                  />
                  {actionData?.errors?.name?.message ? (
                    <div>{actionData.errors.name.message}</div>
                  ) : null}
                </div>
                <div className="mb-2 form-control w-full">
                  {/* TODO: Date Input Component */}
                  <Input
                    id="startDate"
                    label="Startdatum"
                    type="date"
                    {...register("startDate")}
                    required
                    errorMessage={actionData?.errors?.startDate?.message}
                  />
                  {actionData?.errors?.startDate?.message ? (
                    <div>{actionData.errors.startDate.message}</div>
                  ) : null}
                </div>
                <div className="mb-2 form-control w-full">
                  {/* TODO: Time Input Component */}
                  <Input
                    id="startTime"
                    label="Startzeit"
                    type="time"
                    {...register("startTime")}
                    required
                    errorMessage={actionData?.errors?.startTime?.message}
                  />
                  {actionData?.errors?.startTime?.message ? (
                    <div>{actionData.errors.startTime.message}</div>
                  ) : null}
                </div>
                <div className="mb-2 form-control w-full">
                  {/* TODO: Date Input Component */}
                  <Input
                    id="endDate"
                    label="Enddatum"
                    type="date"
                    {...register("endDate")}
                    required
                    errorMessage={actionData?.errors?.endDate?.message}
                  />
                  {actionData?.errors?.endDate?.message ? (
                    <div>{actionData.errors.endDate.message}</div>
                  ) : null}
                </div>
                <div className="mb-4 form-control w-full">
                  {/* TODO: Time Input Component */}
                  <Input
                    id="endTime"
                    label="Endzeit"
                    type="time"
                    {...register("endTime")}
                    required
                    errorMessage={actionData?.errors?.endTime?.message}
                  />
                  {actionData?.errors?.endTime?.message ? (
                    <div>{actionData.errors.endTime.message}</div>
                  ) : null}
                </div>
                <button
                  type="submit"
                  className="btn btn-outline-primary ml-auto btn-small"
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
