import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import { format } from "date-fns-tz";
import { useForm } from "react-hook-form";
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
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";

const i18nNS = ["routes/event/create"];
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return object({
    name: string().required(t("validation.name.required")),
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
      .required(t("validation.startDate.required")),
    startTime: string().required(t("validation.startTime.required")),
    endDate: greaterThanDate(
      "endDate",
      "startDate",
      t("validation.endDate.required"),
      t("validation.endDate.greaterThan")
    ),
    endTime: greaterThanTimeOnSameDate(
      "endTime",
      "startTime",
      "startDate",
      "endDate",
      t("validation.endTime.required"),
      t("validation.endTime.greaterThan")
    ),
    child: nullOrString(string()),
    parent: nullOrString(string()),
  });
};

type SchemaType = ReturnType<typeof createSchema>;
type FormType = InferType<SchemaType>;

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient, response } = createAuthClient(request);
  await getSessionUserOrThrow(authClient);

  const url = new URL(request.url);
  const child = url.searchParams.get("child") || "";
  const parent = url.searchParams.get("parent") || "";

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  return json({ child, parent }, { headers: response.headers });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);

  const schema = createSchema(t);

  const parsedFormData = await getFormValues<SchemaType>(request, schema);

  let errors: FormError | null;
  let data;

  try {
    const result = await validateForm<SchemaType>(schema, parsedFormData);
    errors = result.errors;
    data = result.data;
  } catch (error) {
    throw json({ message: t("error.validation.Failed") }, { status: 400 });
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
  return json({ data, errors });
};

export default function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const { register } = useForm<FormType>();
  const { t } = useTranslation(i18nNS);

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
            <span className="ml-2">{t("content.back")}</span>
          </button>
        </div>
      </section>
      <div className="container relative pt-20 pb-44">
        <div className="flex -mx-4 justify-center">
          <div className="md:flex-1/2 px-4 pt-10 lg:pt-0">
            <h4 className="font-semibold">{t("content.headline")}</h4>
            <div className="pt-10 lg:pt-0">
              <Form method="post">
                <input name="child" defaultValue={loaderData.child} hidden />
                <input name="parent" defaultValue={loaderData.parent} hidden />
                <div className="mb-2">
                  <Input
                    id="name"
                    label={t("form.name.label")}
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
                    label={t("form.startDate.label")}
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
                    label={t("form.startTime.label")}
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
                    label={t("form.endDate.label")}
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
                    label={t("form.endTime.label")}
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
                  {t("form.submit.label")}
                </button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
