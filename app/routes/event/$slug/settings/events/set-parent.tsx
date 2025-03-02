import type { ActionFunctionArgs } from "react-router";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { type SetEventParentLocales } from "./set-parent.server";
import {
  getEventBySlug,
  updateParentEventRelationOrThrow,
} from "./utils.server";

const schema = z.object({
  parentEventId: z.string().optional(),
});

export const setParentSchema = schema;

const environmentSchema = z.object({
  slug: z.string(),
});

const createMutation = (locales: SetEventParentLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const event = await getEventBySlug(environment.slug);
    if (event === null) {
      throw locales.error.notFound.current;
    }
    let parentEventName;
    if (values.parentEventId !== undefined) {
      const parentEvent = await getEventBySlug(values.parentEventId);
      if (parentEvent === null) {
        throw locales.error.notFound.parent;
      }
      const parentStartTime = new Date(parentEvent.startTime).getTime();
      const parentEndTime = new Date(parentEvent.endTime).getTime();
      const eventStartTime = new Date(event.startTime).getTime();
      const eventEndTime = new Date(event.endTime).getTime();
      if (parentStartTime > eventStartTime || parentEndTime < eventEndTime) {
        throw new InputError(locales.error.notInTime, "parentEventId");
      }
      parentEventName = parentEvent.name;
    }
    return { ...values, parentEventName: parentEventName };
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/events/set-parent"];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { slug: slug },
  });

  if (result.success === true) {
    await updateParentEventRelationOrThrow(slug, result.data.parentEventId);
    if (
      result.data.parentEventId !== undefined &&
      result.data.parentEventName !== undefined
    ) {
      return {
        message: `Die Veranstaltung "${result.data.parentEventName}" ist jetzt Rahmenveranstaltung für Eure Veranstaltung.`,
      };
    } else {
      return {
        message: locales.feedback,
      };
    }
  }
  return { ...result };
};
