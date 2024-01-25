import type { ActionArgs, LinksFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useParams,
  useTransition,
} from "@remix-run/react";
import { format } from "date-fns";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Form as RemixForm } from "remix-forms";
import type { InferType } from "yup";
import { array, object, string } from "yup";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import SelectField from "~/components/FormElements/SelectField/SelectField";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";

import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import {
  createAreaOptionFromData,
  objectListOperationResolver,
} from "~/lib/utils/components";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import type { FormError } from "~/lib/utils/yup";
import {
  getFormDataValidationResultOrThrow,
  greaterThanDate,
  greaterThanTimeOnSameDate,
  multiline,
  nullOrString,
  website,
} from "~/lib/utils/yup";
import {
  getAreas,
  getExperienceLevels,
  getFocuses,
  getStages,
  getTags,
  getEventTargetGroups,
  getTypes,
} from "~/utils.server";
import { getEventVisibilitiesBySlugOrThrow } from "../utils.server";
import { type action as cancelAction, cancelSchema } from "./events/cancel";
import { type action as publishAction, publishSchema } from "./events/publish";
import {
  transformEventToForm,
  transformFormToEvent,
  updateEventById,
  validateTimePeriods,
} from "./utils.server";

import quillStyles from "react-quill/dist/quill.snow.css";
import { invariantResponse } from "~/lib/utils/response";
import { deriveEventMode } from "../../utils.server";
import { getEventBySlug, getEventBySlugForAction } from "./general.server";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";

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
    startTime: string()
      .transform((value: string) => {
        value = value.trim();
        if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          return value;
        }
        return undefined;
      })
      .required(t("validation.startTime.required")),
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
    participationUntilDate: greaterThanDate(
      "participationUntilDate",
      "participationFromDate",
      t("validation.participationUntilDate.required"),
      t("validation.participationUntilDate.greaterThan")
    ),
    participationUntilTime: greaterThanTimeOnSameDate(
      "participationUntilTime",
      "participationFromTime",
      "participationUntilDate",
      "participationFromDate",
      t("validation.participationUntilTime.required"),
      t("validation.participationUntilTime.greaterThan")
    ),
    participationFromDate: greaterThanDate(
      "startDate",
      "participationFromDate",
      t("validation.participationFromDate.required"),
      t("validation.participationFromDate.greaterThan")
    ),
    participationFromTime: greaterThanTimeOnSameDate(
      "startTime",
      "participationFromTime",
      "startDate",
      "participationFromDate",
      t("validation.participationFromTime.required"),
      t("validation.participationFromTime.greaterThan")
    ),
    subline: nullOrString(multiline()),
    description: nullOrString(multiline()),
    focuses: array(string().required()).required(),
    eventTargetGroups: array(string().required()).required(),
    experienceLevel: nullOrString(string()),
    stage: nullOrString(string()),
    types: array(string().required()).required(),
    tags: array(string().required()).required(),
    conferenceLink: nullOrString(website()),
    conferenceCode: nullOrString(string()),
    areas: array(string().required()).required(),
    venueName: nullOrString(string()),
    venueStreet: nullOrString(string()),
    venueStreetNumber: nullOrString(string()),
    venueCity: nullOrString(string()),
    venueZipCode: nullOrString(string()),
    submit: string().required(),
    privateFields: array(string().required()).required(),
  });
};

type SchemaType = ReturnType<typeof createSchema>;
type FormType = InferType<SchemaType>;

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, ["routes/event/settings/general"]);
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlug(slug);
  invariantResponse(event, t("error.notFound"), { status: 404 });
  const eventVisibilities = await getEventVisibilitiesBySlugOrThrow(slug);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const focuses = await getFocuses();
  const types = await getTypes();
  const tags = await getTags();
  const eventTargetGroups = await getEventTargetGroups();
  const experienceLevels = await getExperienceLevels();
  const stages = await getStages();
  const areas = await getAreas();

  const transformedEvent = transformEventToForm(event);

  return json(
    {
      event: transformedEvent,
      eventVisibilities,
      focuses,
      types,
      tags,
      eventTargetGroups,
      experienceLevels,
      stages,
      areas,
    },
    { headers: response.headers }
  );
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: quillStyles },
];

export const action = async (args: ActionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, ["routes/event/settings/general"]);

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);

  const event = await getEventBySlugForAction(slug);
  invariantResponse(event, t("error.notFound"), { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const result = await getFormDataValidationResultOrThrow<SchemaType>(
    request,
    createSchema(t)
  );

  let updated = false;

  let errors = result.errors;
  let data = result.data;

  const formData = await request.clone().formData();

  const eventData = transformFormToEvent(result.data);
  // Time Period Validation
  // startTime and endTime of this event is in the boundary of parentEvents startTime and endTime
  // startTime and endTime of all childEvents is in the boundary of this event
  // Did not add this to schema as it is much more code and worse to read
  errors = validateTimePeriods(
    eventData,
    event.parentEvent,
    event.childEvents,
    errors
  );

  if (result.data.submit === "submit") {
    if (result.errors === null) {
      const { privateFields, ...rest } = eventData;
      await updateEventById(event.id, rest, privateFields);
      updated = true;
    }
  } else {
    const listData: (keyof FormType)[] = [
      "focuses",
      "types",
      "eventTargetGroups",
      "tags",
      "areas",
    ];
    listData.forEach((key) => {
      data = objectListOperationResolver<FormType>(data, key, formData);
    });
  }

  return json(
    {
      data: { ...data, id: event.id },
      errors,
      updated,
      lastSubmit: (formData.get("submit") as string) ?? "",
    },
    { headers: response.headers }
  );
};

function General() {
  const { slug } = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const {
    event: originalEvent,
    eventVisibilities,
    focuses,
    types,
    eventTargetGroups,
    tags,
    experienceLevels,
    stages,
    areas,
  } = loaderData;

  const publishFetcher = useFetcher<typeof publishAction>();
  const cancelFetcher = useFetcher<typeof cancelAction>();
  const { t } = useTranslation(["routes/event/settings/general"]);

  const transition = useTransition();
  const actionData = useActionData<typeof action>();
  let event: typeof loaderData["event"];
  if (actionData !== undefined) {
    const { focuses, types, eventTargetGroups, tags, areas, ...rest } =
      originalEvent;
    event = {
      ...rest,
      focuses: actionData.data.focuses,
      types: actionData.data.types,
      eventTargetGroups: actionData.data.eventTargetGroups,
      tags: actionData.data.tags,
      areas: actionData.data.areas,
    };
  } else {
    event = originalEvent;
  }

  const formRef = React.createRef<HTMLFormElement>();
  const isSubmitting = transition.state === "submitting";

  const methods = useForm<FormType>();
  const {
    register,
    reset,
    formState: { isDirty },
  } = methods;

  let errors: FormError | null = null;
  if (actionData !== undefined) {
    errors = actionData.errors;
  }

  const experienceLevelOptions = experienceLevels.map((experienceLevel) => {
    return {
      label: experienceLevel.title,
      value: experienceLevel.id,
    };
  });

  const stageOptions = stages.map((item) => {
    return {
      label: item.title,
      value: item.id,
    };
  });

  const focusOptions = focuses
    .filter((focus) => {
      return !event.focuses.includes(focus.id);
    })
    .map((item) => {
      return {
        label: item.title,
        value: item.id,
      };
    });

  const selectedFocuses =
    event.focuses && focuses
      ? focuses
          .filter((focus) => event.focuses.includes(focus.id))
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  const typeOptions = types
    .filter((type) => {
      return !event.types.includes(type.id);
    })
    .map((type) => {
      return {
        label: type.title,
        value: type.id,
      };
    });

  const selectedTypes =
    event.types && types
      ? types
          .filter((type) => event.types.includes(type.id))
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  const eventTargetGroupOptions = eventTargetGroups
    .filter((targetGroup) => {
      return !event.eventTargetGroups.includes(targetGroup.id);
    })
    .map((targetGroup) => {
      return {
        label: targetGroup.title,
        value: targetGroup.id,
      };
    });

  const selectedEventTargetGroups =
    event.eventTargetGroups && eventTargetGroups
      ? eventTargetGroups
          .filter((targetGroup) =>
            event.eventTargetGroups.includes(targetGroup.id)
          )
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  const tagOptions = tags
    .filter((tag) => {
      return !event.tags.includes(tag.id);
    })
    .map((tag) => {
      return {
        label: tag.title,
        value: tag.id,
      };
    });

  const selectedTags =
    event.tags && tags
      ? tags
          .filter((tag) => event.tags.includes(tag.id))
          .sort((a, b) => a.title.localeCompare(b.title))
      : [];

  const areaOptions = createAreaOptionFromData(areas);

  const selectedAreas =
    event.areas && areas
      ? areas
          .filter((area) => event.areas.includes(area.id))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

  React.useEffect(() => {
    if (isSubmitting && formRef.current !== null) {
      const $inputsToClear =
        formRef.current.getElementsByClassName("clear-after-submit");
      if ($inputsToClear) {
        Array.from($inputsToClear).forEach(
          // TODO: can this type assertion be removed and proofen by code?
          (a) => ((a as HTMLInputElement).value = "")
        );
      }
    }
  }, [isSubmitting, formRef]);

  React.useEffect(() => {
    if (actionData !== undefined) {
      if (actionData.data.submit === "submit" && actionData.errors !== null) {
        const errorElement = document.getElementsByName(
          Object.keys(actionData.errors)[0]
        );
        const yPosition =
          errorElement[0].getBoundingClientRect().top -
          document.body.getBoundingClientRect().top -
          window.innerHeight / 2;
        window.scrollTo(0, yPosition);

        errorElement[0].focus({ preventScroll: true });
      }
    }
  }, [actionData]);

  const isFormChanged =
    isDirty ||
    transition.state === "submitting" ||
    (actionData !== undefined && actionData.updated === false);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>
      <h4 className="mb-4 font-semibold">{t("content.start.headline")}</h4>

      <p className="mb-4">{t("content.start.intro")}</p>
      <div className="flex mb-4">
        <RemixForm
          schema={cancelSchema}
          fetcher={cancelFetcher}
          action={`/event/${slug}/settings/events/cancel`}
          hiddenFields={["cancel"]}
          values={{
            cancel: !event.canceled,
          }}
        >
          {(props) => {
            const { Button, Field } = props;
            return (
              <>
                <Field name="cancel"></Field>
                <div className="mt-2">
                  <Button className="btn btn-outline-primary ml-auto btn-small">
                    {event.canceled ? t("content.revert") : t("content.cancel")}
                  </Button>
                </div>
              </>
            );
          }}
        </RemixForm>
      </div>
      <FormProvider {...methods}>
        <Form
          ref={formRef}
          id="general-settings-form"
          method="post"
          onSubmit={() => {
            reset({}, { keepValues: true });
          }}
        >
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("startDate")}
                id="startDate"
                label={t("form.startDate.label")}
                defaultValue={event.startDate}
                errorMessage={errors?.startDate?.message}
                type="date"
              />
              {errors?.startDate?.message ? (
                <div>{errors.startDate.message}</div>
              ) : null}
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("startTime")}
                id="startTime"
                label={t("form.startTime.label")}
                defaultValue={event.startTime}
                errorMessage={errors?.startTime?.message}
                type="time"
                withPublicPrivateToggle={false}
                isPublic={eventVisibilities.startTime}
              />
              {errors?.startTime?.message ? (
                <div>{errors.startTime.message}</div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("endDate")}
                id="endDate"
                label={t("form.endDate.label")}
                defaultValue={event.endDate}
                errorMessage={errors?.endDate?.message}
                type="date"
              />
              {errors?.endDate?.message ? (
                <div>{errors.endDate.message}</div>
              ) : null}
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("endTime")}
                id="endTime"
                label={t("form.endTime.label")}
                defaultValue={event.endTime}
                errorMessage={errors?.endTime?.message}
                type="time"
                withPublicPrivateToggle={false}
                isPublic={eventVisibilities.endTime}
              />
              {errors?.endTime?.message ? (
                <div>{errors.endTime.message}</div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("participationFromDate")}
                id="participationFromDate"
                label={t("form.participationFromDate.label")}
                defaultValue={event.participationFromDate}
                errorMessage={errors?.participationFromDate?.message}
                type="date"
              />
              {errors?.participationFromDate?.message ? (
                <div>{errors.participationFromDate.message}</div>
              ) : null}
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("participationFromTime")}
                id="participationFromTime"
                label={t("form.participationFromTime.label")}
                defaultValue={event.participationFromTime}
                errorMessage={errors?.participationFromTime?.message}
                type="time"
                withPublicPrivateToggle={false}
                isPublic={eventVisibilities.participationFrom}
              />
              {errors?.participationFromTime?.message ? (
                <div>{errors.participationFromTime.message}</div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("participationUntilDate")}
                id="participationUntilDate"
                label={t("form.participationUntilDate.label")}
                defaultValue={event.participationUntilDate}
                errorMessage={errors?.participationUntilDate?.message}
                type="date"
              />
              {errors?.participationUntilDate?.message ? (
                <div>{errors.participationUntilDate.message}</div>
              ) : null}
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("participationUntilTime")}
                id="participationUntilTime"
                label={t("form.participationUntilTime.label")}
                defaultValue={event.participationUntilTime}
                errorMessage={errors?.participationUntilTime?.message}
                type="time"
                withPublicPrivateToggle={false}
                isPublic={eventVisibilities.participationUntil}
              />
              {errors?.participationUntilTime?.message ? (
                <div>{errors.participationUntilTime.message}</div>
              ) : null}
            </div>
          </div>
          <h4 className="mb-4 font-semibold">{t("content.location")}</h4>
          <div className="mb-4">
            <SelectField
              {...register("stage")}
              name="stage"
              label={t("form.stage.label")}
              placeholder={t("form.stage.placeholder")}
              options={stageOptions}
              defaultValue={event.stage || ""}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.stage}
            />
          </div>

          <div className="mb-6">
            <InputText
              {...register("venueName")}
              id="venueName"
              label={t("form.venueName.label")}
              defaultValue={event.venueName || ""}
              errorMessage={errors?.venueName?.message}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.venueName}
            />
            {errors?.venueName?.message ? (
              <div>{errors.venueName.message}</div>
            ) : null}
          </div>
          <div className="flex flex-col md:flex-row -mx-4">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("venueStreet")}
                id="venueStreet"
                label={t("form.venueStreet.label")}
                defaultValue={event.venueStreet || ""}
                errorMessage={errors?.venueStreet?.message}
                withPublicPrivateToggle={false}
                isPublic={eventVisibilities.venueStreet}
              />
              {errors?.venueStreet?.message ? (
                <div>{errors.venueStreet.message}</div>
              ) : null}
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("venueStreetNumber")}
                id="venueStreetNumber"
                label={t("form.venueStreetNumber.label")}
                defaultValue={event.venueStreetNumber || ""}
                errorMessage={errors?.venueStreetNumber?.message}
                withPublicPrivateToggle={false}
                isPublic={eventVisibilities.venueStreetNumber}
              />
              {errors?.venueStreetNumber?.message ? (
                <div>{errors.venueStreetNumber.message}</div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("venueZipCode")}
                id="venueZipCode"
                label={t("form.venueZipCode.label")}
                defaultValue={event.venueZipCode || ""}
                errorMessage={errors?.venueZipCode?.message}
                withPublicPrivateToggle={false}
                isPublic={eventVisibilities.venueZipCode}
              />
              {errors?.venueZipCode?.message ? (
                <div>{errors.venueZipCode.message}</div>
              ) : null}
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("venueCity")}
                id="venueCity"
                label={t("form.venueCity.label")}
                defaultValue={event.venueCity || ""}
                errorMessage={errors?.venueCity?.message}
                withPublicPrivateToggle={false}
                isPublic={eventVisibilities.venueCity}
              />
              {errors?.venueCity?.message ? (
                <div>{errors.venueCity.message}</div>
              ) : null}
            </div>
          </div>
          <div className="basis-full mb-6">
            <InputText
              {...register("conferenceLink")}
              id="conferenceLink"
              label={t("form.conferenceLink.label")}
              defaultValue={event.conferenceLink || ""}
              placeholder=""
              errorMessage={errors?.conferenceLink?.message}
              withClearButton
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.conferenceLink}
            />
            {errors?.conferenceLink?.message ? (
              <div>{errors.conferenceLink.message}</div>
            ) : null}
          </div>
          <div className="mb-6">
            <InputText
              {...register("conferenceCode")}
              id="conferenceCode"
              label={t("form.conferenceCode.label")}
              defaultValue={event.conferenceCode || ""}
              errorMessage={errors?.conferenceCode?.message}
              withClearButton
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.conferenceCode}
            />
            {errors?.conferenceCode?.message ? (
              <div>{errors.conferenceCode.message}</div>
            ) : null}
          </div>

          <h4 className="mb-4 font-semibold">
            {t("content.generic.headline")}
          </h4>
          <p className="mb-8">{t("content.generic.intro")}</p>
          <div className="mb-6">
            <InputText
              {...register("name")}
              id="name"
              label={t("form.name.label")}
              defaultValue={event.name}
              errorMessage={errors?.name?.message}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.name}
            />
            {errors?.name?.message ? <div>{errors.name.message}</div> : null}
          </div>

          <div className="mb-4">
            <TextAreaWithCounter
              {...register("subline")}
              id="subline"
              defaultValue={event.subline || ""}
              label={t("form.subline.label")}
              errorMessage={errors?.subline?.message}
              maxCharacters={100}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.subline}
            />
            {errors?.subline?.message ? (
              <div>{errors.subline.message}</div>
            ) : null}
          </div>
          <div className="mb-4">
            <TextAreaWithCounter
              {...register("description")}
              id="description"
              defaultValue={event.description || ""}
              label={t("form.description.label")}
              errorMessage={errors?.description?.message}
              maxCharacters={2000}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.description}
              rte
            />
            {errors?.description?.message ? (
              <div>{errors.description.message}</div>
            ) : null}
          </div>
          <div className="mb-4">
            <SelectAdd
              name="types"
              label={t("form.types.label")}
              placeholder={t("form.types.placeholder")}
              entries={selectedTypes.map((type) => ({
                label: type.title,
                value: type.id,
              }))}
              options={typeOptions}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.types}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="tags"
              label={t("form.tags.label")}
              placeholder={t("form.tags.placeholder")}
              entries={selectedTags.map((tag) => ({
                label: tag.title,
                value: tag.id,
              }))}
              options={tagOptions}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.tags}
            />
          </div>

          <div className="mb-4">
            <SelectAdd
              name="targetGroups"
              label={t("form.targetGroups.label")}
              placeholder={t("form.targetGroups.placeholder")}
              entries={selectedEventTargetGroups.map((targetGroup) => ({
                label: targetGroup.title,
                value: targetGroup.id,
              }))}
              options={eventTargetGroupOptions}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.eventTargetGroups}
            />
          </div>
          <div className="mb-4">
            <SelectField
              {...register("experienceLevel")}
              name="experienceLevel"
              label={t("form.experienceLevel.label")}
              placeholder={t("form.experienceLevel.placeholder")}
              options={experienceLevelOptions}
              defaultValue={event.experienceLevel || ""}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.experienceLevel}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="focuses"
              label={t("form.focuses.label")}
              placeholder={t("form.focuses.placeholder")}
              entries={selectedFocuses.map((focus) => ({
                label: focus.title,
                value: focus.id,
              }))}
              options={focusOptions}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.focuses}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="areas"
              label={t("form.areas.label")}
              placeholder={t("form.areas.placeholder")}
              entries={selectedAreas.map((area) => ({
                label: area.name,
                value: area.id,
              }))}
              options={areaOptions}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.areas}
            />
          </div>
        </Form>
      </FormProvider>
      <footer className="fixed bg-white border-t-2 border-primary w-full inset-x-0 bottom-0 pb-24 md:pb-0">
        <div className="container">
          <div className="flex flex-row flex-nowrap items-center justify-end my-4">
            <div
              className={`text-green-500 text-bold ${
                actionData?.updated && !isSubmitting
                  ? "block animate-fade-out"
                  : "hidden"
              }`}
            >
              {t("content.feedback")}
            </div>

            {isFormChanged ? (
              <Link
                to={`/event/${slug}/settings`}
                reloadDocument
                className={`btn btn-link`}
              >
                {t("form.reset.label")}
              </Link>
            ) : null}
            <div></div>
            <button
              type="submit"
              name="submit"
              value="submit"
              form="general-settings-form"
              className="btn btn-primary ml-4"
              disabled={isSubmitting || !isFormChanged}
            >
              {t("form.submit.label")}
            </button>
          </div>
          <div className="flex flex-row flex-nowrap items-center justify-end mb-4">
            <RemixForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
              hiddenFields={["publish"]}
              values={{
                publish: !event.published,
              }}
            >
              {(props) => {
                const { Button, Field } = props;
                return (
                  <>
                    <Field name="publish"></Field>
                    <Button className="btn btn-outline-primary">
                      {event.published
                        ? t("form.hide.label")
                        : t("form.publish.label")}
                    </Button>
                  </>
                );
              }}
            </RemixForm>
          </div>
        </div>
      </footer>
    </>
  );
}

export default General;
