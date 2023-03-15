import type { ActionArgs, LoaderArgs } from "@remix-run/node";
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
import type { InferType, TestContext } from "yup";
import { array, mixed, number, object, string } from "yup";
import type { Defined } from "yup/lib/util/types";
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
  getTargetGroups,
  getTypes,
} from "~/utils.server";
import { getEventBySlugOrThrow } from "../utils.server";
import type { ActionData as CancelActionData } from "./events/cancel";
import { cancelSchema } from "./events/cancel";
import type { ActionData as PublishActionData } from "./events/publish";
import { publishSchema } from "./events/publish";
import {
  checkIdentityOrThrow,
  checkOwnershipOrThrow,
  transformEventToForm,
  transformFormToEvent,
  updateEventById,
} from "./utils.server";

const schema = object({
  userId: string().required(),
  name: string().required("Bitte gib den Namen der Veranstaltung an"),
  startDate: string()
    .transform((value) => {
      try {
        const date = new Date(value);
        return format(date, "yyyy-MM-dd");
      } catch (error) {
        console.log(error);
      }
      return "";
    })
    .required("Bitte gib den Beginn der Veranstaltung an"),
  startTime: string()
    .transform((value) => {
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return value;
      }
      return "";
    })
    .required("Bitte gib den Beginn der Veranstaltung an"),
  endDate: string()
    .transform((value) => {
      try {
        const date = new Date(value);
        return format(date, "yyyy-MM-dd");
      } catch (error) {
        console.log(error);
      }
      return "";
    })
    .required("Bitte gib das Ende der Veranstaltung an")
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
    .transform((value) => {
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return value;
      }
      return "";
    })
    .required("Bitte gib das Ende der Veranstaltung an")
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
  participationUntilDate: string()
    .transform((value) => {
      try {
        const date = new Date(value);
        return format(date, "yyyy-MM-dd");
      } catch (error) {
        console.log(error);
      }
      return "";
    })
    .required("Bitte gib das Ende für die Registrierung an")
    .when("participationFromDate", (participationFromDate, schema) =>
      participationFromDate
        ? schema.test(
            "greaterThanStartDate",
            "Das Registrierungsende darf nicht vor dem Registrierungsstart liegen",
            (participationUntilDate: string | null | undefined) => {
              if (
                participationUntilDate !== null &&
                participationUntilDate !== undefined
              ) {
                return (
                  new Date(participationFromDate).getTime() <=
                  new Date(participationUntilDate).getTime()
                );
              } else {
                return true;
              }
            }
          )
        : schema
    ),
  participationUntilTime: string()
    .transform((value) => {
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return value;
      }
      return "";
    })
    .required("Bitte gib das Ende für die Registrierung an")
    .when("participationFromTime", (participationFromTime, schema) =>
      participationFromTime
        ? schema.test(
            "greaterThanParticipationUntilTimeOnSameDate",
            "Die Registrierungsphase findet an einem Tag statt. Dabei darf der Registrierungsstart nicht nach dem Registrierungsende liegen",
            (
              participationUntilTime: string | null | undefined,
              testContext: TestContext
            ) => {
              if (
                participationUntilTime &&
                testContext.parent.endDate &&
                testContext.parent.startDate
              ) {
                const participationUntilTimeArray =
                  participationUntilTime.split(":");
                const participationUntilTimeHours = parseInt(
                  participationUntilTimeArray[0]
                );
                const participationUntilTimeMinutes = parseInt(
                  participationUntilTimeArray[1]
                );
                const participationFromTimeArray =
                  testContext.parent.participationFromTime.split(":");
                const participationFromTimeHours = parseInt(
                  participationFromTimeArray[0]
                );
                const participationFromTimeMinutes = parseInt(
                  participationFromTimeArray[1]
                );
                const participationFromDateObject = new Date(
                  testContext.parent.participationFromDate
                );
                const participationUntilDateObject = new Date(
                  testContext.parent.participationUntilDate
                );
                if (
                  participationFromDateObject.getFullYear() ===
                    participationUntilDateObject.getFullYear() &&
                  participationFromDateObject.getMonth() ===
                    participationUntilDateObject.getMonth() &&
                  participationFromDateObject.getDate() ===
                    participationUntilDateObject.getDate()
                ) {
                  if (
                    participationFromTimeHours === participationUntilTimeHours
                  ) {
                    return (
                      participationFromTimeMinutes <
                      participationUntilTimeMinutes
                    );
                  } else {
                    return (
                      participationFromTimeHours < participationUntilTimeHours
                    );
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
  participationFromDate: string()
    .transform((value) => {
      try {
        const date = new Date(value);
        return format(date, "yyyy-MM-dd");
      } catch (error) {
        console.log(error);
      }
      return "";
    })
    .required("Bitte gib den Beginn für die Registrierung an")
    .when("startDate", (startDate, schema) =>
      startDate
        ? schema.test(
            "greaterThanStartDate",
            "Das Startdatum darf nicht vor dem Registrierungsstart liegen",
            (participationFromDate: string | null | undefined) => {
              if (
                participationFromDate !== null &&
                participationFromDate !== undefined
              ) {
                return (
                  new Date(startDate).getTime() >=
                  new Date(participationFromDate).getTime()
                );
              } else {
                return true;
              }
            }
          )
        : schema
    ),
  participationFromTime: string()
    .transform((value) => {
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return value;
      }
      return "";
    })
    .required("Bitte gib den Beginn für die Registrierung an")
    .when("startTime", (startTime, schema) =>
      startTime
        ? schema.test(
            "greaterThanStartTimeOnSameDate",
            "Die Registrierungsphase startet am selben Tag wie die Veranstaltung. Dabei darf der Registrierungsstart nicht nach dem Veranstaltungsstart liegen",
            (
              participationFromTime: string | null | undefined,
              testContext: TestContext
            ) => {
              if (
                participationFromTime &&
                testContext.parent.endDate &&
                testContext.parent.startDate
              ) {
                const participationFromTimeArray =
                  participationFromTime.split(":");
                const participationFromTimeHours = parseInt(
                  participationFromTimeArray[0]
                );
                const participationFromTimeMinutes = parseInt(
                  participationFromTimeArray[1]
                );
                const startTimeArray = testContext.parent.startTime.split(":");
                const startTimeHours = parseInt(startTimeArray[0]);
                const startTimeMinutes = parseInt(startTimeArray[1]);
                const startDateObject = new Date(testContext.parent.startDate);
                const participationFromDateObject = new Date(
                  testContext.parent.participationFromDate
                );
                if (
                  startDateObject.getFullYear() ===
                    participationFromDateObject.getFullYear() &&
                  startDateObject.getMonth() ===
                    participationFromDateObject.getMonth() &&
                  startDateObject.getDate() ===
                    participationFromDateObject.getDate()
                ) {
                  if (startTimeHours === participationFromTimeHours) {
                    return startTimeMinutes > participationFromTimeMinutes;
                  } else {
                    return startTimeHours > participationFromTimeHours;
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

  subline: nullOrString(multiline()),
  description: nullOrString(multiline()),
  // published: mixed()
  //   .test((value) => {
  //     return (
  //       value === "on" ||
  //       value === "off" ||
  //       value === null ||
  //       value === true ||
  //       value === false
  //     );
  //   })
  //   .transform((value) => {
  //     return value === "on" || value === true;
  //   })
  //   .nullable()
  //   .required(),
  focuses: array(string().required()).required(),
  targetGroups: array(string().required()).required(),
  experienceLevel: nullOrString(string()),
  stage: nullOrString(string()),
  types: array(string().required()).required(),
  tags: array(string().required()).required(),
  conferenceLink: nullOrString(website()),
  conferenceCode: nullOrString(string()),
  participantCount: string().required(),
  participantLimit: mixed() // inspired by https://github.com/jquense/yup/issues/298#issue-353217237
    .test((value) => {
      return (
        value === null ||
        value === "" ||
        value === 0 ||
        number().isValidSync(value)
      );
    })
    .when("participantCount", (participantCount, schema) =>
      participantCount
        ? schema.test(
            "lessThanParticipantCount",
            "Achtung! Es nehmen bereits mehr Personen teil als die aktuell eingestellte Teilnahmebegrenzung. Bitte zuerst die entsprechende Anzahl der Teilnehmenden zur Warteliste hinzufügen.",
            (participantLimit: string | null | undefined) => {
              if (
                !(
                  participantLimit === null ||
                  participantLimit === undefined ||
                  participantLimit === "" ||
                  participantLimit === "0"
                )
              ) {
                return participantLimit > participantCount;
              } else {
                return true;
              }
            }
          )
        : schema
    )
    .transform((value) => {
      return value === null || value === "" || value === "0"
        ? null
        : Number(value);
    })
    .nullable(),
  areas: array(string().required()).required(),
  venueName: nullOrString(string()),
  venueStreet: nullOrString(string()),
  venueStreetNumber: nullOrString(string()),
  venueCity: nullOrString(string()),
  venueZipCode: nullOrString(string()),
  submit: string().required(),
});

type SchemaType = typeof schema;
type FormType = InferType<typeof schema>;

export const loader = async (args: LoaderArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, sessionUser);

  const focuses = await getFocuses();
  const types = await getTypes();
  const tags = await getTags();
  const targetGroups = await getTargetGroups();
  const experienceLevels = await getExperienceLevels();
  const stages = await getStages();
  const areas = await getAreas();

  return json(
    {
      event: transformEventToForm(event),
      userId: sessionUser.id,
      focuses,
      types,
      tags,
      targetGroups,
      experienceLevels,
      stages,
      areas,
    },
    { headers: response.headers }
  );
};

export const action = async (args: ActionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);

  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);

  await checkIdentityOrThrow(request, sessionUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, sessionUser);

  const result = await getFormDataValidationResultOrThrow<SchemaType>(
    request,
    schema
  );

  let updated = false;

  let errors = result.errors;
  let data = result.data;

  const formData = await request.clone().formData();

  if (result.data.submit === "submit") {
    if (result.errors === null) {
      const data = transformFormToEvent(result.data);
      await updateEventById(event.id, data);
      updated = true;
    }
  } else {
    const listData: (keyof FormType)[] = [
      "focuses",
      "types",
      "targetGroups",
      "tags",
      "areas",
    ];
    listData.forEach((key) => {
      data = objectListOperationResolver<FormType>(data, key, formData);
    });
  }

  return json(
    {
      data,
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
    userId,
    focuses,
    types,
    targetGroups,
    tags,
    experienceLevels,
    stages,
    areas,
  } = loaderData;

  const publishFetcher = useFetcher<PublishActionData>();
  const cancelFetcher = useFetcher<CancelActionData>();

  const transition = useTransition();
  const actionData = useActionData<typeof action>();
  const newEvent = actionData?.data;

  const formRef = React.createRef<HTMLFormElement>();
  const isSubmitting = transition.state === "submitting";

  let event: typeof loaderData["event"] | Defined<typeof newEvent>;
  if (newEvent !== undefined) {
    event = newEvent;
  } else {
    event = originalEvent;
  }

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

  const targetGroupOptions = targetGroups
    .filter((targetGroup) => {
      return !event.targetGroups.includes(targetGroup.id);
    })
    .map((targetGroup) => {
      return {
        label: targetGroup.title,
        value: targetGroup.id,
      };
    });

  const selectedTargetGroups =
    event.targetGroups && targetGroups
      ? targetGroups
          .filter((targetGroup) => event.targetGroups.includes(targetGroup.id))
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
    isDirty || (actionData !== undefined && actionData.updated === false);

  return (
    <>
      <RemixForm
        schema={publishSchema}
        fetcher={publishFetcher}
        action={`/event/${slug}/settings/events/publish`}
        hiddenFields={["eventId", "userId", "publish"]}
        values={{
          // TODO: Fix type issue
          // @ts-ignore
          eventId: event.id,
          userId: userId,
          publish: !originalEvent.published,
        }}
      >
        {(props) => {
          const { Button, Field } = props;
          return (
            <>
              <Field name="userId" />
              <Field name="eventId" />
              <Field name="publish"></Field>
              <div className="mt-2">
                <Button className="btn btn-outline-primary ml-auto btn-small">
                  {originalEvent.published ? "Verstecken" : "Veröffentlichen"}
                </Button>
              </div>
            </>
          );
        }}
      </RemixForm>
      <RemixForm
        schema={cancelSchema}
        fetcher={cancelFetcher}
        action={`/event/${slug}/settings/events/cancel`}
        hiddenFields={["eventId", "userId", "cancel"]}
        values={{
          // TODO: Fix type issue
          // @ts-ignore
          eventId: event.id,
          userId: userId,
          cancel: !originalEvent.canceled,
        }}
      >
        {(props) => {
          const { Button, Field } = props;
          return (
            <>
              <Field name="userId" />
              <Field name="eventId" />
              <Field name="cancel"></Field>
              <div className="mt-2">
                <Button className="btn btn-outline-primary ml-auto btn-small">
                  {originalEvent.canceled
                    ? "Absage rückgängig machen"
                    : "Absagen"}
                </Button>
              </div>
            </>
          );
        }}
      </RemixForm>
      <FormProvider {...methods}>
        <Form
          ref={formRef}
          method="post"
          onSubmit={() => {
            reset({}, { keepValues: true });
          }}
        >
          <h1 className="mb-8">Deine Veranstaltung</h1>
          <h4 className="mb-4 font-semibold">Allgemein</h4>
          <p className="mb-8">Lorem ipsum</p>
          {/* <label htmlFor="published">Veröffentlicht?</label>
        <input
          {...register("published")}
          id="published"
          name="published"
          type="checkbox"
          defaultChecked={event.published}
        />
        <p
          className="text-red-600"
          hidden={errors === null || errors.published === undefined}
        >
          {errors?.published?.message}
        </p> */}
          <input name="userId" defaultValue={userId} hidden />
          <input
            name="participantCount"
            defaultValue={loaderData.event._count.participants}
            hidden
          />
          <div className="mb-6">
            <InputText
              {...register("name")}
              id="name"
              label="Name"
              defaultValue={event.name}
              errorMessage={errors?.name?.message}
            />
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("startDate")}
                id="startDate"
                label="Startet am"
                defaultValue={event.startDate}
                errorMessage={errors?.startDate?.message}
                type="date"
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("startTime")}
                id="startTime"
                label="Startet um"
                defaultValue={event.startTime}
                errorMessage={errors?.startTime?.message}
                type="time"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("endDate")}
                id="endDate"
                label="Endet am"
                defaultValue={event.endDate}
                errorMessage={errors?.endDate?.message}
                type="date"
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("endTime")}
                id="endTime"
                label="Endet um"
                defaultValue={event.endTime}
                errorMessage={errors?.endTime?.message}
                type="time"
              />
            </div>
          </div>
          <h4 className="mb-4 font-semibold">Registrierung</h4>

          <p className="mb-8">Lorem Ipsum</p>
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("participationFromDate")}
                id="participationFromDate"
                label="Registrierung startet am"
                defaultValue={event.participationFromDate}
                errorMessage={errors?.participationFromDate?.message}
                type="date"
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("participationFromTime")}
                id="participationFromTime"
                label="Registrierung startet um"
                defaultValue={event.participationFromTime}
                errorMessage={errors?.participationFromTime?.message}
                type="time"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("participationUntilDate")}
                id="participationUntilDate"
                label="Registrierung endet am"
                defaultValue={event.participationUntilDate}
                errorMessage={errors?.participationUntilDate?.message}
                type="date"
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("participationUntilTime")}
                id="participationUntilTime"
                label="Registrierung endet um"
                defaultValue={event.participationUntilTime}
                errorMessage={errors?.participationUntilTime?.message}
                type="time"
              />
            </div>
          </div>
          <div className="mb-6">
            <InputText
              {...register("participantLimit")}
              id="participantLimit"
              label="Begrenzung der Teilnehmenden"
              defaultValue={event.participantLimit || ""}
              errorMessage={errors?.participantLimit?.message}
              type="number"
            />
          </div>
          <h4 className="mb-4 font-semibold">Veranstaltungsort</h4>
          <div className="mb-4">
            <SelectField
              {...register("stage")}
              name="stage"
              label={"Veranstaltungstyp"}
              placeholder="Wähle den Veranstaltungstyp aus."
              options={stageOptions}
              defaultValue={event.stage || ""}
            />
          </div>

          <div className="mb-6">
            <InputText
              {...register("venueName")}
              id="venueName"
              label="Name des Veranstaltungsorts"
              defaultValue={event.venueName || ""}
              errorMessage={errors?.venueName?.message}
            />
          </div>
          <div className="flex flex-col md:flex-row -mx-4">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("venueStreet")}
                id="venueStreet"
                label="Straßenname"
                defaultValue={event.venueStreet || ""}
                errorMessage={errors?.venueStreet?.message}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("venueStreetNumber")}
                id="venueStreetNumber"
                label="Hausnummer"
                defaultValue={event.venueStreetNumber || ""}
                errorMessage={errors?.venueStreetNumber?.message}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row -mx-4 mb-2">
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("venueZipCode")}
                id="venueZipCode"
                label="PLZ"
                defaultValue={event.venueZipCode || ""}
                errorMessage={errors?.venueZipCode?.message}
              />
            </div>
            <div className="basis-full md:basis-6/12 px-4 mb-6">
              <InputText
                {...register("venueCity")}
                id="venueCity"
                label="Stadt"
                defaultValue={event.venueCity || ""}
                errorMessage={errors?.venueCity?.message}
              />
            </div>
          </div>

          <div className="mb-4">
            <TextAreaWithCounter
              {...register("subline")}
              id="subline"
              defaultValue={event.subline || ""}
              label="Subline"
              errorMessage={errors?.subline?.message}
              maxCharacters={70}
            />
          </div>
          <div className="mb-4">
            <TextAreaWithCounter
              {...register("description")}
              id="description"
              defaultValue={event.description || ""}
              label="Beschreibung"
              errorMessage={errors?.description?.message}
              maxCharacters={1000}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="focuses"
              label={"MINT-Schwerpunkte"}
              placeholder="Füge die MINT-Schwerpunkte hinzu."
              entries={selectedFocuses.map((focus) => ({
                label: focus.title,
                value: focus.id,
              }))}
              options={focusOptions}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="targetGroups"
              label={"Zielgruppen"}
              placeholder="Füge die Zielgruppen hinzu."
              entries={selectedTargetGroups.map((targetGroup) => ({
                label: targetGroup.title,
                value: targetGroup.id,
              }))}
              options={targetGroupOptions}
            />
          </div>
          <div className="mb-4">
            <SelectField
              {...register("experienceLevel")}
              name="experienceLevel"
              label={"Erfahrungsstufe"}
              placeholder="Wähle die Erfahrungsstufe aus."
              options={experienceLevelOptions}
              defaultValue={event.experienceLevel || ""}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="types"
              label={"Veranstaltungstypen"}
              placeholder="Füge die veranstaltungstypen hinzu."
              entries={selectedTypes.map((type) => ({
                label: type.title,
                value: type.id,
              }))}
              options={typeOptions}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="tags"
              label={"Schlagworte"}
              placeholder="Füge die Schlagworte hinzu."
              entries={selectedTags.map((tag) => ({
                label: tag.title,
                value: tag.id,
              }))}
              options={tagOptions}
            />
          </div>
          <div className="mb-4">
            <SelectAdd
              name="areas"
              label={"Aktivitätsgebiete"}
              placeholder="Füge die Aktivitätsgebiete hinzu."
              entries={selectedAreas.map((area) => ({
                label: area.name,
                value: area.id,
              }))}
              options={areaOptions}
            />
          </div>
          <h4 className="mb-4 font-semibold">Konferenz</h4>

          <p className="mb-8">Lorem Ipsum</p>
          <div className="basis-full mb-4">
            <InputText
              {...register("conferenceLink")}
              id="conferenceLink"
              label="Konferenzlink"
              defaultValue={event.conferenceLink || ""}
              placeholder=""
              errorMessage={errors?.conferenceLink?.message}
              withClearButton
            />
          </div>
          <div className="mb-6">
            <InputText
              {...register("conferenceCode")}
              id="conferenceCode"
              label="Zugangscode zur Konferenz"
              defaultValue={event.conferenceCode || ""}
              errorMessage={errors?.conferenceCode?.message}
              withClearButton
            />
          </div>
          <footer className="fixed z-10 bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
            <div className="container">
              <div className="py-4 md:py-8 flex flex-row flex-nowrap items-center justify-between md:justify-end">
                <div
                  className={`text-green-500 text-bold ${
                    actionData?.updated && !isSubmitting
                      ? "block animate-fade-out"
                      : "hidden"
                  }`}
                >
                  Deine Informationen wurden aktualisiert.
                </div>

                {isFormChanged ? (
                  <Link
                    to={`/event/${slug}/settings`}
                    reloadDocument
                    className={`btn btn-link`}
                  >
                    Änderungen verwerfen
                  </Link>
                ) : null}
                <div></div>
                <button
                  type="submit"
                  name="submit"
                  value="submit"
                  className="btn btn-primary ml-4"
                  disabled={isSubmitting || !isFormChanged}
                >
                  Speichern
                </button>
              </div>
            </div>
          </footer>
        </Form>
      </FormProvider>
    </>
  );
}

export default General;
