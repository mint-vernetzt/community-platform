import { makeDomainFunction } from "domain-functions";
import type { ActionFunctionArgs } from "react-router";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import {
  addAdminToEvent,
  type AddEventAdminLocales,
  getEventBySlug,
  getProfileById,
} from "./add-admin.server";

const schema = z.object({
  profileId: z.string().trim().uuid(),
});

const environmentSchema = z.object({
  eventSlug: z.string(),
});

export const addAdminSchema = schema;

const createMutation = (locales: AddEventAdminLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);
    if (profile === null) {
      throw locales.error.inputError.doesNotExist;
    }
    const alreadyAdmin = profile.administeredEvents.some((relation) => {
      return relation.event.slug === environment.eventSlug;
    });
    if (alreadyAdmin) {
      throw locales.error.inputError.alreadyAdmin;
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
    languageModuleMap[language]["event/$slug/settings/admins/add-admin"];
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { eventSlug: slug },
  });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, locales.error.notFound, { status: 404 });
    await addAdminToEvent(event.id, result.data.profileId);

    return {
      message: insertParametersIntoLocale(locales.feedback, {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      }),
    };
  }
  return { ...result };
};
