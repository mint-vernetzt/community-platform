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
import { array, boolean, InferType, mixed, number, object, string } from "yup";
import { getUserByRequestOrThrow } from "~/auth.server";
import InputText from "~/components/FormElements/InputText/InputText";
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
  published: boolean().required(),
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
        <input name="id" defaultValue={userId} hidden />
        <InputText
          {...register("name")}
          id="name"
          label="Name"
          defaultValue={event.name}
          errorMessage={errors?.name?.message}
        />

        <div className="m-2">
          <label htmlFor="startDate">Start Date*</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className="mx-2 border"
            defaultValue={event.startDate as string}
            required
          />
          <label htmlFor="startTime">Start Time</label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            className="mx-2 border"
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
