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
import { getProfileById } from "../utils.server";
import { type AddEventSpeakerLocales } from "./add-speaker.server";
import { connectSpeakerProfileToEvent, getEventBySlug } from "./utils.server";

const schema = z.object({
  profileId: z.string(),
});

export const addSpeakerSchema = schema;

const environmentSchema = z.object({
  eventSlug: z.string(),
});

const createMutation = (locales: AddEventSpeakerLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);
    if (profile === null) {
      throw new InputError(locales.error.inputError.doesNotExist, "profileId");
    }
    const alreadySpeaker = profile.contributedEvents.some((entry) => {
      return entry.event.slug === environment.eventSlug;
    });
    if (alreadySpeaker) {
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
    languageModuleMap[language]["event/$slug/settings/speakers/add-speaker"];
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
    environment: {
      eventSlug: slug,
    },
  });

  if (result.success) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, locales.error.notFound, { status: 404 });
    await connectSpeakerProfileToEvent(event.id, result.data.profileId);
    return {
      message: insertParametersIntoLocale(locales.feedback, {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      }),
    };
  }

  return { ...result };
};
