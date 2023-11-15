import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import {
  addTeamMemberToEvent,
  getEventBySlug,
  getProfileById,
} from "./add-member.server";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";

const schema = z.object({
  profileId: z.string(),
});

const environmentSchema = z.object({
  eventSlug: z.string(),
});

export const addMemberSchema = schema;

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);
    if (profile === null) {
      throw new InputError(t("error.inputError.doesNotExist"), "profileId");
    }
    const alreadyMember = profile.teamMemberOfEvents.some((relation) => {
      return relation.event.slug === environment.eventSlug;
    });
    if (alreadyMember) {
      throw new InputError(t("error.inputError.alreadyIn"), "profileId");
    }
    return {
      ...values,
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/event/settings/team/add-member",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { eventSlug: slug },
  });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, t("error.notFound"), { status: 404 });
    await addTeamMemberToEvent(event.id, result.data.profileId);
    return json(
      {
        message: t("feedback", {
          firstName: result.data.firstName,
          lastName: result.data.lastName,
        }),
      },
      { headers: response.headers }
    );
  }
  return json(result, { headers: response.headers });
};
