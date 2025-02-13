import type { ActionFunctionArgs } from "react-router";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import {
  type AddEventTeamMemberLocales,
  addTeamMemberToEvent,
  getEventBySlug,
  getProfileById,
} from "./add-member.server";

const schema = z.object({
  profileId: z.string(),
});

const environmentSchema = z.object({
  eventSlug: z.string(),
});

export const addMemberSchema = schema;

const createMutation = (locales: AddEventTeamMemberLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);
    if (profile === null) {
      throw new InputError(locales.error.inputError.doesNotExist, "profileId");
    }
    const alreadyMember = profile.teamMemberOfEvents.some((relation) => {
      return relation.event.slug === environment.eventSlug;
    });
    if (alreadyMember) {
      throw new InputError(locales.error.inputError.alreadyIn, "profileId");
    }
    return {
      ...values,
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/team/add-member"];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { eventSlug: slug },
  });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, locales.error.notFound, { status: 404 });
    await addTeamMemberToEvent(event.id, result.data.profileId);
    return {
      message: insertParametersIntoLocale(locales.feedback, {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      }),
    };
  }
  return { ...result };
};
