import { ActionFunction, LoaderFunction } from "remix";
import { array, boolean, date, number, object, string } from "yup";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { multiline, nullOrString, website } from "~/lib/utils/yup";
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
    .required("Please add a start date"),
  startTime: nullOrString(string()),
  endDate: date()
    .nullable()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    })
    .defined(),
  endTime: nullOrString(string()),
  description: nullOrString(multiline()),
  published: boolean().required(),
  updatedAt: date().transform(() => new Date()),
  focuses: array(string().required()).required(),
  targetGroups: array(string().required()).required(),
  experienceLevel: string().nullable(),
  types: array(string().required()).required(),
  tags: array(string().required()).required(),
  conferenceLink: website(),
  conferenceCode: string(),
  participantLimit: number(),
  participationUntilDate: date()
    .transform((current, original) => {
      if (original === "") {
        return null;
      }
      return current;
    })
    .nullable()
    .required("Please add a start date"),
  participationUntilTime: nullOrString(string()),
  areas: array(string().required()).required(),
  venueName: nullOrString(string()),
  venueStreet: nullOrString(string()),
  venueStreetNumber: nullOrString(string()),
  venueCity: nullOrString(string()),
  venueZipCode: nullOrString(string()),
});

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

export const action: ActionFunction = async (args) => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");
  const currentUser = await getUserByRequestOrThrow(request);

  await checkIdentityOrThrow(request, currentUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  return null;
};

function General() {
  return <h1>General</h1>;
}

export default General;
