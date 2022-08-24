import { ActionFunction } from "remix";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { serverError } from "remix-utils";
import { z } from "zod";
import { getUserByRequestOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { prismaClient } from "~/prisma";
import { checkSameEventOrThrow, getEventByIdOrThrow } from "../../utils.server";
import { checkIdentityOrThrow, checkOwnershipOrThrow } from "../utils.server";

const schema = z.object({
  userId: z.string(),
  eventId: z.string(),
  parentEventId: z.string().optional(),
});

export const setParentSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action: ActionFunction = async (args) => {
  const { request } = args;

  await checkFeatureAbilitiesOrThrow(request, "events");
  const currentUser = await getUserByRequestOrThrow(request);
  await checkIdentityOrThrow(request, currentUser);

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const event = await getEventByIdOrThrow(result.data.eventId);
    await checkOwnershipOrThrow(event, currentUser);
    await checkSameEventOrThrow(request, event.id);

    try {
      console.log("data to update parent event", result.data);
      if (result.data.parentEventId === undefined) {
        await prismaClient.event.update({
          where: { id: event.id },
          data: { updatedAt: new Date(), parentEvent: { disconnect: true } },
        });
      } else {
        await prismaClient.event.update({
          where: { id: event.id },
          data: {
            updatedAt: new Date(),
            parentEvent: { connect: { id: result.data.parentEventId } },
          },
        });
      }
    } catch (error) {
      console.error(error);
      throw serverError({ message: "Couldn't set parent event" });
    }
  }
  return result;
};
