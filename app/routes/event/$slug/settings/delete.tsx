import { ActionFunction, LoaderFunction } from "remix";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { badRequest } from "remix-utils";
import { z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { getEventBySlugOrThrow } from "../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "./utils.server";

const schema = z.object({
  userId: z.string().optional(),
  eventId: z.string().optional(),
  eventName: z.string().optional(),
});

const environmentSchema = z.object({ id: z.string(), name: z.string() });

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);
  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  return { userId: currentUser.id, eventId: event.id };
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (values.eventId !== environment.id) {
    throw new Error("Id nicht korrekt");
  }
  if (values.eventName !== environment.name) {
    throw new InputError(
      "Der Name der Veranstaltung ist nicht korrekt",
      "eventName"
    );
  }
  try {
    //
  } catch (error) {
    throw "Die Veranstaltung konnte nicht gelöscht werden.";
  }
});

export const action: ActionFunction = async (args) => {
  const { request, params } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");

  const slug = getParamValueOrThrow(params, "slug");

  const currentUser = await getUserByRequestOrThrow(request);

  await checkIdentityOrThrow(request, currentUser);

  const event = await getEventBySlugOrThrow(slug);

  await checkOwnershipOrThrow(event, currentUser);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { id: event.id, name: event.name },
  });

  if (result.success === false) {
    if (
      result.errors._global !== undefined &&
      result.errors._global.includes("Id nicht korrekt")
    ) {
      throw badRequest({ message: "Id nicht korrekt" });
    }
  }

  return result;
};

function Delete() {}

export default Delete;
