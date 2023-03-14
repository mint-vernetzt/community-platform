import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { format, zonedTimeToUtc } from "date-fns-tz";
import { useForm } from "react-hook-form";
import { badRequest } from "remix-utils";
import type { InferType, TestContext } from "yup";
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
  name: string().required("Bitte einen Veranstaltungsnamen angeben"),
  startDate: date()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    })
    .nullable()
    .required("Bitte ein Startdatum angeben"),
  startTime: string().required("Bitte eine Startzeit angeben"),
  endDate: date()
    .nullable()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    })
    .defined()
    .required("Bitte ein Enddatum angeben")
    .when("startDate", (startDate, schema) =>
      startDate
        ? schema.test(
            "greaterThanStartDate",
            "Das Enddatum darf nicht vor dem Startdatum liegen",
            (endDate: string | null | undefined) => {
              if (endDate !== null && endDate !== undefined) {
                return (
                  new Date(startDate).getTime() <= new Date(endDate).getTime()
                );
              } else {
                return true;
              }
            }
          )
        : schema
    ),
  endTime: string()
    .required("Bitte eine Endzeit angeben")
    .when("startTime", (startTime, schema) =>
      startTime
        ? schema.test(
            "greaterThanEndTimeOnSameDate",
            "Die Veranstaltung findet an einem Tag statt. Dabei darf die Startzeit nicht nach der Endzeit liegen",
            (endTime: string | null | undefined, testContext: TestContext) => {
              if (
                endTime &&
                testContext.parent.endDate &&
                testContext.parent.startDate
              ) {
                const endTimeArray = endTime.split(":");
                const endTimeHours = parseInt(endTimeArray[0]);
                const endTimeMinutes = parseInt(endTimeArray[1]);
                const startTimeArray = testContext.parent.startTime.split(":");
                const startTimeHours = parseInt(startTimeArray[0]);
                const startTimeMinutes = parseInt(startTimeArray[1]);
                const startDateObject = new Date(testContext.parent.startDate);
                const endDateObject = new Date(testContext.parent.endDate);
                if (
                  startDateObject.getFullYear() ===
                    endDateObject.getFullYear() &&
                  startDateObject.getMonth() === endDateObject.getMonth() &&
                  startDateObject.getDate() === endDateObject.getDate()
                ) {
                  if (startTimeHours === endTimeHours) {
                    return startTimeMinutes < endTimeMinutes;
                  } else {
                    return startTimeHours < endTimeHours;
                  }
                } else {
                  return true;
                }
              } else {
                return true;
              }
            }
          )
        : schema
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
  const sessionUser = await getSessionUserOrThrow(authClient);

  const url = new URL(request.url);
  const child = url.searchParams.get("child") || "";
  const parent = url.searchParams.get("parent") || "";

  await validateFeatureAccess(authClient, "events");

  return json(
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

export const action = async (args: ActionArgs) => {
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

  return json({ data, errors }, { headers: response.headers });
};

export default function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const { register } = useForm<FormType>();
  let errorMessages = [];
  if (actionData !== undefined) {
    for (let field in actionData.errors) {
      errorMessages.push(actionData.errors[field].message);
    }
  }

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
                <div className="mb-2">
                  <Input
                    id="name"
                    label="Name der Veranstaltung"
                    required
                    {...register("name")}
                  />
                </div>
                <div className="mb-2 form-control w-full">
                  {/* TODO: Date Input Component */}
                  <label className="label" htmlFor="startDate">
                    Startdatum *
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    className="input input-bordered input-lg w-full"
                    required
                  />
                </div>
                <div className="mb-2 form-control w-full">
                  {/* TODO: Time Input Component */}
                  <label className="label" htmlFor="startTime">
                    Startzeit *
                  </label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    className="input input-bordered input-lg w-full"
                    required
                  />
                </div>
                <div className="mb-2 form-control w-full">
                  {/* TODO: Date Input Component */}
                  <label className="label" htmlFor="endDate">
                    Enddatum *
                  </label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    className="input input-bordered input-lg w-full"
                    required
                  />
                </div>
                <div className="mb-4 form-control w-full">
                  {/* TODO: Time Input Component */}
                  <label className="label" htmlFor="endTime">
                    Endzeit *
                  </label>
                  <input
                    id="endTime"
                    name="endTime"
                    type="time"
                    className="input input-bordered input-lg w-full"
                    required
                  />
                </div>
                {errorMessages !== undefined
                  ? errorMessages.map((message, index) => {
                      return (
                        <div className="mb-2" key={index}>
                          {message}
                        </div>
                      );
                    })
                  : null}
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
