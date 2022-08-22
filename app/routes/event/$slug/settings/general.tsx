import { format } from "date-fns";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  useActionData,
  useLoaderData,
  useParams,
  useTransition,
} from "remix";
import { array, InferType, mixed, number, object, string } from "yup";
import { getUserByRequestOrThrow } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
import SelectAdd from "~/components/FormElements/SelectAdd/SelectAdd";
import SelectField from "~/components/FormElements/SelectField/SelectField";
import TextAreaWithCounter from "~/components/FormElements/TextAreaWithCounter/TextAreaWithCounter";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  FormError,
  getFormDataValidationResultOrThrow,
  multiline,
  nullOrString,
} from "~/lib/utils/yup";
import { getEventBySlugOrThrow } from "../utils.server";
import {
  checkIdentityOrThrow,
  checkOwnershipOrThrow,
  enhanceEventWithRelations as transformEventToForm,
} from "./utils.server";

const schema = object({
  id: string().required(),
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
    .required("Bitte gib das Ende der Veranstaltung an"),
  endTime: string()
    .transform((value) => {
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return value;
      }
      return "";
    })
    .required("Bitte gib das Ende der Veranstaltung an"),
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
    .required("Bitte gib das Ende für die Registrierung an"),
  participationUntilTime: string()
    .transform((value) => {
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return value;
      }
      return "";
    })
    .required("Bitte gib den Beginn für die Registrierung an"),

  description: nullOrString(multiline()),
  published: mixed()
    .test((value) => {
      return (
        value === "on" ||
        value === "off" ||
        value === null ||
        value === true ||
        value === false
      );
    })
    .transform((value) => {
      return value === "on" || value === true;
    })
    .nullable()
    .required(),
  focuses: array(string().required()).required(),
  targetGroups: array(string().required()).required(),
  experienceLevel: nullOrString(string()),
  types: array(string().required()).required(),
  tags: array(string().required()).required(),
  conferenceLink: string().url(),
  conferenceCode: string(),
  participantLimit: mixed() // inspired by https://github.com/jquense/yup/issues/298#issue-353217237
    .test((value) => {
      return (
        value === null ||
        value === "" ||
        value === 0 ||
        number().isValidSync(value)
      );
    })
    .transform((value) =>
      value === null || value === "" || value === 0 ? null : Number(value)
    )
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

type LoaderData = {
  event: ReturnType<typeof transformEventToForm>;
  userId: string;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  return { event: transformEventToForm(event), userId: currentUser.id };
};

type ActionData = {
  data: FormType;
  errors: FormError | null;
  updated: boolean;
};

export const action: ActionFunction = async (args): Promise<ActionData> => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);

  await checkIdentityOrThrow(request, currentUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  const result = await getFormDataValidationResultOrThrow<SchemaType>(
    request,
    schema
  );

  let updated = false;

  if (result.data.submit === "submit") {
    if (result.errors === null) {
      updated = true;
    }
  }

  return { ...result, updated };
};

function General() {
  const { slug } = useParams();
  const { event: originalEvent, userId } = useLoaderData<LoaderData>();

  const transition = useTransition();
  const actionData = useActionData<ActionData>();

  const formRef = React.createRef<HTMLFormElement>();
  const isSubmitting = transition.state === "submitting";

  let event;
  if (actionData !== undefined) {
    event = actionData.data;
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

  console.log("Errors", errors);

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
        <label htmlFor="published">Veröffentlicht?</label>
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
        </p>
        <input name="id" defaultValue={userId} hidden />
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
        <h4 className="mb-4 font-semibold">Veranstaltungsort</h4>

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
              errorMessage={errors?.venueStreet?.message}
            />
          </div>
          <div className="basis-full md:basis-6/12 px-4 mb-6">
            <InputText
              {...register("venueStreetNumber")}
              id="venueStreetNumber"
              label="Hausnummer"
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
              errorMessage={errors?.venueZipCode?.message}
            />
          </div>
          <div className="basis-full md:basis-6/12 px-4 mb-6">
            <InputText
              {...register("venueCity")}
              id="venueCity"
              label="Stadt"
              errorMessage={errors?.venueCity?.message}
            />
          </div>
        </div>
        <h4 className="mb-4 font-semibold">Registrierung</h4>

        <p className="mb-8">Lorem Ipsum</p>
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
            defaultValue={event.participantLimit}
            errorMessage={errors?.participantLimit?.message}
            type="number"
          />
        </div>
        <div className="mb-4">
          <TextAreaWithCounter
            {...register("description")}
            id="description"
            defaultValue={event.description || ""}
            label="Beschreibung"
            errorMessage={errors?.description?.message}
            maxCharacters={500}
          />
        </div>
        <div className="mb-4">
          <SelectAdd
            name="focuses"
            label={"MINT-Schwerpunkte"}
            placeholder="Füge die MINT-Schwerpunkte hinzu."
            entries={[]}
            options={[]}
          />
        </div>
        <div className="mb-4">
          <SelectAdd
            name="targetGroups"
            label={"Zielgruppen"}
            placeholder="Füge die Zielgruppen hinzu."
            entries={[]}
            options={[]}
          />
        </div>
        <div className="mb-4">
          <SelectField
            name="experienceLevel"
            label={"Erfahrungsstufe"}
            placeholder="Wähle die Erfahrungsstufe aus."
            options={[]}
          />
        </div>
        <div className="mb-4">
          <SelectAdd
            name="types"
            label={"Veranstaltungstypen"}
            placeholder="Füge die veranstaltungstypen hinzu."
            entries={[]}
            options={[]}
          />
        </div>
        <div className="mb-4">
          <SelectAdd
            name="tags"
            label={"Schlagworte"}
            placeholder="Füge die Schlagworte hinzu."
            entries={[]}
            options={[]}
          />
        </div>
        <div className="mb-4">
          <SelectAdd
            name="areas"
            label={"Aktivitätsgebiete"}
            placeholder="Füge die Aktivitätsgebiete hinzu."
            entries={[]}
            options={[]}
          />
        </div>
        <h4 className="mb-4 font-semibold">Konferenz</h4>

        <p className="mb-8">Lorem Ipsum</p>
        <div className="basis-full mb-4">
          <InputText
            {...register("conferenceLink")}
            id="conferenceLink"
            label="Konferenzlink"
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

              {isFormChanged && (
                <Link
                  to={`/organization/${slug}/settings`}
                  reloadDocument
                  className={`btn btn-link`}
                >
                  Änderungen verwerfen
                </Link>
              )}
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
  );
}

export default General;
