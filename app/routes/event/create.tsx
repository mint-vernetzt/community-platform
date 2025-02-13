import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { Form, useActionData, useLoaderData, useNavigate } from "react-router";
import { format } from "date-fns-tz";
import { useForm } from "react-hook-form";
import type { InferType } from "yup";
import { object, string } from "yup";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
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
import { type CreateEventLocales, getEventById } from "./create.server";
import { createEventOnProfile, transformFormToEvent } from "./utils.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { invariantResponse } from "~/lib/utils/response";

const createSchema = (locales: CreateEventLocales) => {
  return object({
    name: string().required(locales.validation.name.required),
    startDate: string()
      .transform((value) => {
        value = value.trim();
        const date = new Date(value);
        return format(date, "yyyy-MM-dd");
      })
      .required(locales.validation.startDate.required),
    startTime: string().required(locales.validation.startTime.required),
    endDate: greaterThanDate(
      "endDate",
      "startDate",
      locales.validation.endDate.required,
      locales.validation.endDate.greaterThan
    ),
    endTime: greaterThanTimeOnSameDate(
      "endTime",
      "startTime",
      "startDate",
      "endDate",
      locales.validation.endTime.required,
      locales.validation.endTime.greaterThan
    ),
    child: nullOrString(string()),
    parent: nullOrString(string()),
  });
};

type SchemaType = ReturnType<typeof createSchema>;
type FormType = InferType<SchemaType>;

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/create"];

  const url = new URL(request.url);
  const child = url.searchParams.get("child") || "";
  const parent = url.searchParams.get("parent") || "";

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  return { child, parent, locales };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/create"];
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const schema = createSchema(locales);

  const parsedFormData = await getFormValues<SchemaType>(request, schema);

  let errors: FormError | null;
  let data;

  try {
    const result = await validateForm<SchemaType>(schema, parsedFormData);
    errors = result.errors;
    data = result.data;
  } catch (error) {
    invariantResponse(false, locales.error.validationFailed, { status: 400 });
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
    return redirect(`/event/${slug}`);
  }
  return { data, errors };
};

export default function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const { register } = useForm<FormType>();

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl @md:mv-mt-2">
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
            <span className="ml-2">{locales.content.back}</span>
          </button>
        </div>
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative">
        <div className="flex -mx-4 justify-center mv-w-full">
          <div className="@lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/2 px-4 pt-10 mv-w-full">
            <h4 className="font-semibold">{locales.content.headline}</h4>
            <div>
              <Form method="post">
                <input name="child" defaultValue={loaderData.child} hidden />
                <input name="parent" defaultValue={loaderData.parent} hidden />
                <div className="mb-2">
                  <Input
                    id="name"
                    label={locales.form.name.label}
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
                    label={locales.form.startDate.label}
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
                    label={locales.form.startTime.label}
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
                    label={locales.form.endDate.label}
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
                    label={locales.form.endTime.label}
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
                  {locales.form.submit.label}
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
