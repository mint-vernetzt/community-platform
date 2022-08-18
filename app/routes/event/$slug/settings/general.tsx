import { ActionFunction, LoaderFunction } from "remix";
import {
  array,
  boolean,
  date,
  InferType,
  mixed,
  number,
  object,
  string,
} from "yup";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  FormError,
  getFormDataValidationResultOrThrow,
  multiline,
  nullOrString,
  website,
} from "~/lib/utils/yup";
import { getEventBySlugOrThrow } from "../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "./utils.server";

const schema = object({
  id: string().required(),
  name: string().required("Bitte gib den Namen der Veranstaltung an"),
  startDate: date()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    })
    .nullable()
    .required("Bitte gib den Beginn der Veranstaltung an"),
  startTime: mixed()
    .test((value) => {
      return (
        value === null ||
        value === "" ||
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
      );
    })
    .transform((value) => {
      return value === null || value === "" ? null : value;
    })
    .nullable(),
  endDate: date()
    .nullable()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    })
    .defined(),
  endTime: mixed()
    .test((value) => {
      return (
        value === null ||
        value === "" ||
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
      );
    })
    .transform((value) => {
      return value === null || value === "" ? null : value;
    })
    .nullable(),
  description: nullOrString(multiline()),
  published: boolean().required(),
  focuses: array(string().required()).required(),
  targetGroups: array(string().required()).required(),
  experienceLevel: nullOrString(string()),
  types: array(string().required()).required(),
  tags: array(string().required()).required(),
  conferenceLink: website(),
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
  participationUntilDate: date()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    })
    .nullable(),
  participationUntilTime: mixed()
    .test((value) => {
      return (
        value === null ||
        value === "" ||
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
      );
    })
    .transform((value) => {
      return value === null || value === "" ? null : value;
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

type LoaderData = {
  event: Awaited<ReturnType<typeof getEventBySlugOrThrow>>;
};

export const loader: LoaderFunction = async (args): Promise<LoaderData> => {
  const { request, params } = args;
  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  return { event };
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
  return <h1>General</h1>;
}

export default General;
