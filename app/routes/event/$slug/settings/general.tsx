import { format } from "date-fns";
import { createRef, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useParams,
} from "react-router";
import type { InferType } from "yup";
import { array, object, string } from "yup";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import { TextArea } from "~/components-next/TextArea";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import SelectField from "~/components/FormElements/SelectField/SelectField";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { detectLanguage } from "~/i18n.server";
import {
  createAreaOptionFromData,
  objectListOperationResolver,
} from "~/lib/utils/components";
import { invariantResponse } from "~/lib/utils/response";
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
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import {
  getAreas,
  getEventTargetGroups,
  getExperienceLevels,
  getFocuses,
  getStages,
  getTags,
  getTypes,
} from "~/utils.server";
import { deriveEventMode } from "../../utils.server";
import { getEventVisibilitiesBySlugOrThrow } from "../utils.server";
import { type action as cancelAction, cancelSchema } from "./events/cancel";
import { type action as publishAction, publishSchema } from "./events/publish";
import {
  type GeneralEventSettingsLocales,
  getEventBySlug,
  getEventBySlugForAction,
} from "./general.server";
import {
  transformEventToForm,
  transformFormToEvent,
  updateEventById,
  validateTimePeriods,
} from "./utils.server";

const SUBLINE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 2000;

const createSchema = (locales: GeneralEventSettingsLocales) => {
  return object({
    name: string().required(locales.route.validation.name.required),
    startDate: string()
      .transform((value) => {
        value = value.trim();
        const date = new Date(value);
        return format(date, "yyyy-MM-dd");
      })
      .required(locales.route.validation.startDate.required),
    startTime: string()
      .transform((value: string) => {
        value = value.trim();
        if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          return value;
        }
        return undefined;
      })
      .required(locales.route.validation.startTime.required),
    endDate: greaterThanDate(
      "endDate",
      "startDate",
      locales.route.validation.endDate.required,
      locales.route.validation.endDate.greaterThan
    ),
    endTime: greaterThanTimeOnSameDate(
      "endTime",
      "startTime",
      "startDate",
      "endDate",
      locales.route.validation.endTime.required,
      locales.route.validation.endTime.greaterThan
    ),
    participationUntilDate: greaterThanDate(
      "participationUntilDate",
      "participationFromDate",
      locales.route.validation.participationUntilDate.required,
      locales.route.validation.participationUntilDate.greaterThan
    ),
    participationUntilTime: greaterThanTimeOnSameDate(
      "participationUntilTime",
      "participationFromTime",
      "participationUntilDate",
      "participationFromDate",
      locales.route.validation.participationUntilTime.required,
      locales.route.validation.participationUntilTime.greaterThan
    ),
    participationFromDate: greaterThanDate(
      "startDate",
      "participationFromDate",
      locales.route.validation.participationFromDate.required,
      locales.route.validation.participationFromDate.greaterThan
    ),
    participationFromTime: greaterThanTimeOnSameDate(
      "startTime",
      "participationFromTime",
      "startDate",
      "participationFromDate",
      locales.route.validation.participationFromTime.required,
      locales.route.validation.participationFromTime.greaterThan
    ),
    subline: nullOrString(multiline(SUBLINE_MAX_LENGTH)),
    description: nullOrString(multiline(DESCRIPTION_MAX_LENGTH)),
    descriptionRTEState: nullOrString(
      string().transform((value: string | null | undefined) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      })
    ),
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

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings/general"];
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const event = await getEventBySlug(slug);
  invariantResponse(event, locales.route.error.notFound, { status: 404 });
  const eventVisibilities = await getEventVisibilitiesBySlugOrThrow(slug);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.route.error.notPrivileged, {
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

  return {
    event: transformedEvent,
    eventVisibilities,
    focuses,
    types,
    tags,
    eventTargetGroups,
    experienceLevels,
    stages,
    areas,
    locales,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["event/$slug/settings/general"];

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);

  const event = await getEventBySlugForAction(slug);
  invariantResponse(event, locales.route.error.notFound, { status: 404 });
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.route.error.notPrivileged, {
    status: 403,
  });

  const result = await getFormDataValidationResultOrThrow<SchemaType>(
    request,
    createSchema(locales)
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

  return {
    data: { ...data, id: event.id },
    errors,
    updated,
    lastSubmit: (formData.get("submit") as string) ?? "",
  };
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
    locales,
  } = loaderData;

  const publishFetcher = useFetcher<typeof publishAction>();
  const cancelFetcher = useFetcher<typeof cancelAction>();

  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const event = actionData?.data ?? originalEvent;

  // if (actionData !== undefined) {
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const { focuses, types, eventTargetGroups, tags, areas, ...rest } =
  //     originalEvent;
  //   event = {
  //     ...originalEvent,
  //     focuses: actionData.data.focuses,
  //     types: actionData.data.types,
  //     eventTargetGroups: actionData.data.eventTargetGroups,
  //     tags: actionData.data.tags,
  //     areas: actionData.data.areas,
  //   };
  // } else {
  //   event = originalEvent;
  // }

  const formRef = createRef<HTMLFormElement>();
  const isSubmitting = navigation.state === "submitting";

  const methods = useForm<FormType>();
  const {
    register,
    reset,
    // formState: { isDirty },
  } = methods;

  let errors: FormError | null = null;
  if (actionData !== undefined) {
    errors = actionData.errors;
  }

  const experienceLevelOptions = experienceLevels.map((experienceLevel) => {
    let title;
    if (experienceLevel.slug in locales.experienceLevels) {
      type LocaleKey = keyof typeof locales.experienceLevels;
      title = locales.experienceLevels[experienceLevel.slug as LocaleKey].title;
    } else {
      console.error(
        `Experience level ${experienceLevel.slug} not found in locales`
      );
      title = experienceLevel.slug;
    }
    return {
      label: title,
      value: experienceLevel.id,
    };
  });

  const stageOptions = stages.map((stage) => {
    let title;
    if (stage.slug in locales.stages) {
      type LocaleKey = keyof typeof locales.stages;
      title = locales.stages[stage.slug as LocaleKey].title;
    } else {
      console.error(`Event stage ${stage.slug} not found in locales`);
      title = stage.slug;
    }
    return {
      label: title,
      value: stage.id,
    };
  });

  const focusOptions = focuses
    .filter((focus) => {
      return !event.focuses.includes(focus.id);
    })
    .map((focus) => {
      let title;
      if (focus.slug in locales.focuses) {
        type LocaleKey = keyof typeof locales.focuses;
        title = locales.focuses[focus.slug as LocaleKey].title;
      } else {
        console.error(`Focus ${focus.slug} not found in locales`);
        title = focus.slug;
      }
      return {
        label: title,
        value: focus.id,
      };
    });

  const selectedFocuses =
    event.focuses && focuses
      ? focuses
          .filter((focus) => event.focuses.includes(focus.id))
          .sort((currentFocus, nextFocus) => {
            let currentFocusTitle;
            let nextFocusTitle;
            if (currentFocus.slug in locales.focuses) {
              type LocaleKey = keyof typeof locales.focuses;
              currentFocusTitle =
                locales.focuses[currentFocus.slug as LocaleKey].title;
            } else {
              console.error(`Focus ${currentFocus.slug} not found in locales`);
              currentFocusTitle = currentFocus.slug;
            }
            if (nextFocus.slug in locales.focuses) {
              type LocaleKey = keyof typeof locales.focuses;
              nextFocusTitle =
                locales.focuses[nextFocus.slug as LocaleKey].title;
            } else {
              console.error(`Focus ${nextFocus.slug} not found in locales`);
              nextFocusTitle = nextFocus.slug;
            }
            return currentFocusTitle.localeCompare(nextFocusTitle);
          })
      : [];

  const typeOptions = types
    .filter((type) => {
      return !event.types.includes(type.id);
    })
    .map((type) => {
      let title;
      if (type.slug in locales.eventTypes) {
        type LocaleKey = keyof typeof locales.eventTypes;
        title = locales.eventTypes[type.slug as LocaleKey].title;
      } else {
        console.error(`Type ${type.slug} not found in locales`);
        title = type.slug;
      }
      return {
        label: title,
        value: type.id,
      };
    });

  const selectedTypes =
    event.types && types
      ? types
          .filter((type) => event.types.includes(type.id))
          .sort((currentType, nextType) => {
            let currentTypeTitle;
            let nextTypeTitle;
            if (currentType.slug in locales.eventTypes) {
              type LocaleKey = keyof typeof locales.eventTypes;
              currentTypeTitle =
                locales.eventTypes[currentType.slug as LocaleKey].title;
            } else {
              console.error(
                `Event type ${currentType.slug} not found in locales`
              );
              currentTypeTitle = currentType.slug;
            }
            if (nextType.slug in locales.eventTypes) {
              type LocaleKey = keyof typeof locales.eventTypes;
              nextTypeTitle =
                locales.eventTypes[nextType.slug as LocaleKey].title;
            } else {
              console.error(`Event type ${nextType.slug} not found in locales`);
              nextTypeTitle = nextType.slug;
            }
            return currentTypeTitle.localeCompare(nextTypeTitle);
          })
      : [];

  const eventTargetGroupOptions = eventTargetGroups
    .filter((targetGroup) => {
      return !event.eventTargetGroups.includes(targetGroup.id);
    })
    .map((targetGroup) => {
      let title;
      if (targetGroup.slug in locales.eventTargetGroups) {
        type LocaleKey = keyof typeof locales.eventTargetGroups;
        title = locales.eventTargetGroups[targetGroup.slug as LocaleKey].title;
      } else {
        console.error(
          `Event target group ${targetGroup.slug} not found in locales`
        );
        title = targetGroup.slug;
      }
      return {
        label: title,
        value: targetGroup.id,
      };
    });

  const selectedEventTargetGroups =
    event.eventTargetGroups && eventTargetGroups
      ? eventTargetGroups
          .filter((targetGroup) =>
            event.eventTargetGroups.includes(targetGroup.id)
          )
          .sort((currentTargetGroup, nextTargetGroup) => {
            let currentTargetGroupTitle;
            let nextTargetGroupTitle;
            if (currentTargetGroup.slug in locales.eventTargetGroups) {
              type LocaleKey = keyof typeof locales.eventTargetGroups;
              currentTargetGroupTitle =
                locales.eventTargetGroups[currentTargetGroup.slug as LocaleKey]
                  .title;
            } else {
              console.error(
                `Event target group ${currentTargetGroup.slug} not found in locales`
              );
              currentTargetGroupTitle = currentTargetGroup.slug;
            }
            if (nextTargetGroup.slug in locales.eventTargetGroups) {
              type LocaleKey = keyof typeof locales.eventTargetGroups;
              nextTargetGroupTitle =
                locales.eventTargetGroups[nextTargetGroup.slug as LocaleKey]
                  .title;
            } else {
              console.error(
                `Event target group ${nextTargetGroup.slug} not found in locales`
              );
              nextTargetGroupTitle = nextTargetGroup.slug;
            }
            return currentTargetGroupTitle.localeCompare(nextTargetGroupTitle);
          })
      : [];

  const tagOptions = tags
    .filter((tag) => {
      return !event.tags.includes(tag.id);
    })
    .map((tag) => {
      let title;
      if (tag.slug in locales.tags) {
        type LocaleKey = keyof typeof locales.tags;
        title = locales.tags[tag.slug as LocaleKey].title;
      } else {
        console.error(`Tag ${tag.slug} not found in locales`);
        title = tag.slug;
      }
      return {
        label: title,
        value: tag.id,
      };
    });

  const selectedTags =
    event.tags && tags
      ? tags
          .filter((tag) => event.tags.includes(tag.id))
          .sort((currentTag, nextTag) => {
            let currentTagTitle;
            let nextTagTitle;
            if (currentTag.slug in locales.tags) {
              type LocaleKey = keyof typeof locales.tags;
              currentTagTitle =
                locales.tags[currentTag.slug as LocaleKey].title;
            } else {
              console.error(`Tag ${currentTag.slug} not found in locales`);
              currentTagTitle = currentTag.slug;
            }
            if (nextTag.slug in locales.tags) {
              type LocaleKey = keyof typeof locales.tags;
              nextTagTitle = locales.tags[nextTag.slug as LocaleKey].title;
            } else {
              console.error(`Tag ${nextTag.slug} not found in locales`);
              nextTagTitle = nextTag.slug;
            }
            return currentTagTitle.localeCompare(nextTagTitle);
          })
      : [];

  const areaOptions = createAreaOptionFromData(areas);

  const selectedAreas =
    event.areas && areas
      ? areas
          .filter((area) => event.areas.includes(area.id))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

  useEffect(() => {
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

  useEffect(() => {
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

  // const isFormChanged =
  //   isDirty ||
  //   navigation.state === "submitting" ||
  //   (actionData !== undefined && actionData.updated === false);

  return (
    <>
      <h1 className="mv-mb-8">{locales.route.content.headline}</h1>
      <h4 className="mv-mb-4 mv-font-semibold">
        {locales.route.content.start.headline}
      </h4>

      <p className="mv-mb-4">{locales.route.content.start.intro}</p>
      <div className="mv-flex mv-mb-4">
        <RemixFormsForm
          schema={cancelSchema}
          fetcher={cancelFetcher}
          action={`/event/${slug}/settings/events/cancel`}
        >
          {(remixFormsProps) => {
            const { Button, Field } = remixFormsProps;
            return (
              <>
                <div className="mv-hidden">
                  {/** @ts-expect-error  event.canceled exists because of fetcher */}
                  <Field name="cancel" value={!event.canceled} />
                </div>
                <div className="mv-mt-2">
                  <Button className="mv-ml-auto mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-[.375rem] mv-px-6 mv-normal-case mv-leading-[1.125rem] mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-text-sm mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white">
                    {/** @ts-expect-error  event.canceled exists because of fetcher */}
                    {event.canceled
                      ? locales.route.content.revert
                      : locales.route.content.cancel}
                  </Button>
                </div>
              </>
            );
          }}
        </RemixFormsForm>
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
          <div className="mv-flex mv-flex-col @md:mv-flex-row mv--mx-4 mv-mb-2">
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("startDate")}
                id="startDate"
                label={locales.route.form.startDate.label}
                defaultValue={event.startDate}
                errorMessage={errors?.startDate?.message}
                type="date"
              />
              {errors?.startDate?.message ? (
                <div>{errors.startDate.message}</div>
              ) : null}
            </div>
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("startTime")}
                id="startTime"
                label={locales.route.form.startTime.label}
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
          <div className="mv-flex mv-flex-col @md:mv-flex-row mv--mx-4 mv-mb-2">
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("endDate")}
                id="endDate"
                label={locales.route.form.endDate.label}
                defaultValue={event.endDate}
                errorMessage={errors?.endDate?.message}
                type="date"
              />
              {errors?.endDate?.message ? (
                <div>{errors.endDate.message}</div>
              ) : null}
            </div>
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("endTime")}
                id="endTime"
                label={locales.route.form.endTime.label}
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

          <div className="mv-flex mv-flex-col @md:mv-flex-row mv--mx-4 mv-mb-2">
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("participationFromDate")}
                id="participationFromDate"
                label={locales.route.form.participationFromDate.label}
                defaultValue={event.participationFromDate}
                errorMessage={errors?.participationFromDate?.message}
                type="date"
              />
              {errors?.participationFromDate?.message ? (
                <div>{errors.participationFromDate.message}</div>
              ) : null}
            </div>
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("participationFromTime")}
                id="participationFromTime"
                label={locales.route.form.participationFromTime.label}
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
          <div className="mv-flex mv-flex-col @md:mv-flex-row mv--mx-4 mv-mb-2">
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("participationUntilDate")}
                id="participationUntilDate"
                label={locales.route.form.participationUntilDate.label}
                defaultValue={event.participationUntilDate}
                errorMessage={errors?.participationUntilDate?.message}
                type="date"
              />
              {errors?.participationUntilDate?.message ? (
                <div>{errors.participationUntilDate.message}</div>
              ) : null}
            </div>
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("participationUntilTime")}
                id="participationUntilTime"
                label={locales.route.form.participationUntilTime.label}
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
          <h4 className="mv-mb-4 mv-font-semibold">
            {locales.route.content.location}
          </h4>
          <div className="mv-mb-4">
            <SelectField
              {...register("stage")}
              name="stage"
              label={locales.route.form.stage.label}
              placeholder={locales.route.form.stage.placeholder}
              options={stageOptions}
              defaultValue={event.stage || ""}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.stage}
            />
          </div>

          <div className="mv-mb-6">
            <InputText
              {...register("venueName")}
              id="venueName"
              label={locales.route.form.venueName.label}
              defaultValue={event.venueName || ""}
              errorMessage={errors?.venueName?.message}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.venueName}
            />
            {errors?.venueName?.message ? (
              <div>{errors.venueName.message}</div>
            ) : null}
          </div>
          <div className="mv-flex mv-flex-col @md:mv-flex-row mv--mx-4">
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("venueStreet")}
                id="venueStreet"
                label={locales.route.form.venueStreet.label}
                defaultValue={event.venueStreet || ""}
                errorMessage={errors?.venueStreet?.message}
                withPublicPrivateToggle={false}
                isPublic={eventVisibilities.venueStreet}
              />
              {errors?.venueStreet?.message ? (
                <div>{errors.venueStreet.message}</div>
              ) : null}
            </div>
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("venueStreetNumber")}
                id="venueStreetNumber"
                label={locales.route.form.venueStreetNumber.label}
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
          <div className="mv-flex mv-flex-col @md:mv-flex-row mv--mx-4 mv-mb-2">
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("venueZipCode")}
                id="venueZipCode"
                label={locales.route.form.venueZipCode.label}
                defaultValue={event.venueZipCode || ""}
                errorMessage={errors?.venueZipCode?.message}
                withPublicPrivateToggle={false}
                isPublic={eventVisibilities.venueZipCode}
              />
              {errors?.venueZipCode?.message ? (
                <div>{errors.venueZipCode.message}</div>
              ) : null}
            </div>
            <div className="mv-basis-full @md:mv-basis-6/12 mv-px-4 mv-mb-6">
              <InputText
                {...register("venueCity")}
                id="venueCity"
                label={locales.route.form.venueCity.label}
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
          <div className="mv-basis-full mv-mb-6">
            <InputText
              {...register("conferenceLink")}
              id="conferenceLink"
              label={locales.route.form.conferenceLink.label}
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
          <div className="mv-mb-6">
            <InputText
              {...register("conferenceCode")}
              id="conferenceCode"
              label={locales.route.form.conferenceCode.label}
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

          <h4 className="mv-mb-4 mv-font-semibold">
            {locales.route.content.generic.headline}
          </h4>
          <p className="mv-mb-8">{locales.route.content.generic.intro}</p>
          <div className="mv-mb-6">
            <InputText
              {...register("name")}
              id="name"
              label={locales.route.form.name.label}
              defaultValue={event.name}
              errorMessage={errors?.name?.message}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.name}
            />
            {errors?.name?.message ? <div>{errors.name.message}</div> : null}
          </div>

          <div className="mv-mb-4">
            <TextArea
              {...register("subline")}
              id="subline"
              defaultValue={event.subline || ""}
              label={locales.route.form.subline.label}
              errorMessage={errors?.subline?.message}
              maxLength={SUBLINE_MAX_LENGTH}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.subline}
            />
            {errors?.subline?.message ? (
              <div>{errors.subline.message}</div>
            ) : null}
          </div>
          <div className="mv-mb-4">
            <TextArea
              {...register("description")}
              id="description"
              defaultValue={event.description || ""}
              label={locales.route.form.description.label}
              errorMessage={errors?.description?.message}
              maxLength={DESCRIPTION_MAX_LENGTH}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.description}
              rte={{
                locales: locales,
                defaultValue: event.descriptionRTEState || undefined,
                legacyFormRegister: register("descriptionRTEState"),
              }}
            />
            {errors?.description?.message ? (
              <div>{errors.description.message}</div>
            ) : null}
          </div>
          <div className="mv-mb-4">
            <SelectAdd
              name="types"
              label={locales.route.form.types.label}
              placeholder={locales.route.form.types.placeholder}
              entries={selectedTypes.map((type) => {
                let title;
                if (type.slug in locales.eventTypes) {
                  type LocaleKey = keyof typeof locales.eventTypes;
                  title = locales.eventTypes[type.slug as LocaleKey].title;
                } else {
                  console.error(`Event type ${type.slug} not found in locales`);
                  title = type.slug;
                }
                return {
                  label: title,
                  value: type.id,
                };
              })}
              options={typeOptions}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.types}
            />
          </div>
          <div className="mv-mb-4">
            <SelectAdd
              name="tags"
              label={locales.route.form.tags.label}
              placeholder={locales.route.form.tags.placeholder}
              entries={selectedTags.map((tag) => {
                let title;
                if (tag.slug in locales.tags) {
                  type LocaleKey = keyof typeof locales.tags;
                  title = locales.tags[tag.slug as LocaleKey].title;
                } else {
                  console.error(`Tag ${tag.slug} not found in locales`);
                  title = tag.slug;
                }
                return {
                  label: title,
                  value: tag.id,
                };
              })}
              options={tagOptions}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.tags}
            />
          </div>

          <div className="mv-mb-4">
            <SelectAdd
              name="eventTargetGroups"
              label={locales.route.form.targetGroups.label}
              placeholder={locales.route.form.targetGroups.placeholder}
              entries={selectedEventTargetGroups.map((targetGroup) => {
                let title;
                if (targetGroup.slug in locales.eventTargetGroups) {
                  type LocaleKey = keyof typeof locales.eventTargetGroups;
                  title =
                    locales.eventTargetGroups[targetGroup.slug as LocaleKey]
                      .title;
                } else {
                  console.error(
                    `Target group ${targetGroup.slug} not found in locales`
                  );
                  title = targetGroup.slug;
                }
                return {
                  label: title,
                  value: targetGroup.id,
                };
              })}
              options={eventTargetGroupOptions}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.eventTargetGroups}
            />
          </div>
          <div className="mv-mb-4">
            <SelectField
              {...register("experienceLevel")}
              name="experienceLevel"
              label={locales.route.form.experienceLevel.label}
              placeholder={locales.route.form.experienceLevel.placeholder}
              options={experienceLevelOptions}
              defaultValue={event.experienceLevel || ""}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.experienceLevel}
            />
          </div>
          <div className="mv-mb-4">
            <SelectAdd
              name="focuses"
              label={locales.route.form.focuses.label}
              placeholder={locales.route.form.focuses.placeholder}
              entries={selectedFocuses.map((focus) => {
                let title;
                if (focus.slug in locales.focuses) {
                  type LocaleKey = keyof typeof locales.focuses;
                  title = locales.focuses[focus.slug as LocaleKey].title;
                } else {
                  console.error(`Focus ${focus.slug} not found in locales`);
                  title = focus.slug;
                }
                return {
                  label: title,
                  value: focus.id,
                };
              })}
              options={focusOptions}
              withPublicPrivateToggle={false}
              isPublic={eventVisibilities.focuses}
            />
          </div>
          <div className="mv-mb-4">
            <SelectAdd
              name="areas"
              label={locales.route.form.areas.label}
              placeholder={locales.route.form.areas.placeholder}
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
      <footer className="mv-fixed mv-bg-white mv-border-t-2 mv-border-primary mv-w-full mv-inset-x-0 mv-bottom-0">
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
          <div className="mv-flex mv-flex-row mv-flex-nowrap mv-items-center mv-justify-end mv-my-4">
            <div
              className={`mv-text-green-500 mv-text-bold ${
                actionData?.updated && !isSubmitting ? "mv-block" : "mv-hidden"
              }`}
            >
              {locales.route.content.feedback}
            </div>

            {/* {isFormChanged ? ( */}
            <Link
              to={`/event/${slug}/settings`}
              reloadDocument
              className="mv-text-primary mv-underline mv-text-sm mv-font-semibold"
            >
              {locales.route.form.reset.label}
            </Link>
            {/* ) : null} */}
            <button
              type="submit"
              name="submit"
              value="submit"
              form="general-settings-form"
              className="mv-ml-4 mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-outline-primary mv-shrink-0 mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-border-primary mv-text-sm mv-font-semibold mv-border mv-bg-primary mv-text-white"
              // disabled={isSubmitting || !isFormChanged}
              disabled={isSubmitting}
            >
              {locales.route.form.submit.label}
            </button>
          </div>
          <div className="mv-flex mv-flex-row mv-flex-nowrap mv-items-center mv-justify-end mv-mb-4">
            <RemixFormsForm
              schema={publishSchema}
              fetcher={publishFetcher}
              action={`/event/${slug}/settings/events/publish`}
            >
              {(remixFormsProps) => {
                const { Button, Field } = remixFormsProps;
                return (
                  <>
                    <div className="mv-hidden">
                      {/** @ts-expect-error  event.published exists because of fetcher */}
                      <Field name="publish" value={!event.published} />
                    </div>
                    <Button className="mv-border mv-border-primary mv-bg-white mv-text-primary mv-h-auto mv-min-h-0 mv-whitespace-nowrap mv-py-2 mv-px-6 mv-normal-case mv-leading-6 mv-inline-flex mv-cursor-pointer mv-selct-none mv-flex-wrap mv-items-center mv-justify-center mv-rounded-lg mv-text-center mv-font-semibold mv-gap-2 hover:mv-bg-primary hover:mv-text-white">
                      {/** @ts-expect-error  event.published exists because of fetcher */}
                      {event.published
                        ? locales.route.form.hide.label
                        : locales.route.form.publish.label}
                    </Button>
                  </>
                );
              }}
            </RemixFormsForm>
          </div>
        </div>
      </footer>
    </>
  );
}

export default General;
