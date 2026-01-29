import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { useForm } from "react-hook-form";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import Input from "~/components/legacy/FormElements/Input/Input";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { getFormValues, validateForm, type FormError } from "~/lib/utils/yup";
import { languageModuleMap } from "~/locales/.server";
import {
  checkFeatureAbilitiesOrThrow,
  getFeatureAbilities,
} from "~/routes/feature-access.server";
import { generateEventSlug } from "~/utils.server";
import { validateTimePeriods } from "./$slug/settings/utils.server";
import { getEventById } from "./create.server";
import { createEventOnProfile, transformFormToEvent } from "./utils.server";
import { createSchema, type FormType, type SchemaType } from "./create.shared";

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

  const abilities = await getFeatureAbilities(authClient, "next_event_create");

  return { child, parent, locales, abilities };
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
    console.error({ error });
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
    return redirect(`/event/${slug}/detail/about`);
  }
  return { data, errors };
};

export default function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, abilities } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const { register } = useForm<FormType>();

  return (
    <>
      <section className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl @md:mt-2">
        <div className="font-semibold text-neutral-600 flex items-center">
          {abilities["next_event_create"].hasAccess ? (
            <Button as="link" to="/next/event/create" prefetch="intent">
              Zur neuen Event Erstellung
            </Button>
          ) : null}
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
      <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl relative">
        <div className="flex -mx-4 justify-center w-full">
          <div className="@lg:shrink-0 @lg:grow-0 @lg:basis-1/2 px-4 pt-10 w-full">
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
                <div className="mb-2 flex flex-col gap-2 w-full">
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
                <div className="mb-2 flex flex-col gap-2 w-full">
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
                <div className="mb-2 flex flex-col gap-2 w-full">
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
                <div className="mb-4 flex flex-col gap-2 w-full">
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
                  className="ml-auto border border-primary bg-white text-primary h-auto min-h-0 whitespace-nowrap py-[.375rem] px-6 normal-case leading-[1.125rem] inline-flex cursor-pointer selct-none flex-wrap items-center justify-center rounded-lg text-center text-sm font-semibold gap-2 hover:bg-primary hover:text-white"
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
