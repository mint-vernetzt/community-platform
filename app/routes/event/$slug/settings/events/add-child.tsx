import type { ActionFunctionArgs } from "react-router";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { type AddChildEventLocales } from "./add-child.server";
import { addChildEventRelationOrThrow, getEventBySlug } from "./utils.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

// TODO: Validate start and end time
const schema = z.object({
  childEventId: z.string().min(1),
});

export const addChildSchema = schema;

const environmentSchema = z.object({
  slug: z.string(),
});

const createMutation = (locales: AddChildEventLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const event = await getEventBySlug(environment.slug);
    if (event === null) {
      throw locales.error.notFound.parent;
    }
    const childEvent = await getEventBySlug(values.childEventId);
    if (childEvent === null) {
      throw locales.error.notFound.related;
    }
    const childStartTime = new Date(childEvent.startTime).getTime();
    const childEndTime = new Date(childEvent.endTime).getTime();
    const eventStartTime = new Date(event.startTime).getTime();
    const eventEndTime = new Date(event.endTime).getTime();
    if (childStartTime < eventStartTime || childEndTime > eventEndTime) {
      throw new InputError(locales.error.inputError, "childEventId");
    }
    return { ...values, childEventName: childEvent.name };
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/events/add-child"];
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { slug: slug },
  });

  if (result.success === true) {
    await addChildEventRelationOrThrow(slug, result.data.childEventId);
    return {
      message: insertParametersIntoLocale(locales.feedback, {
        title: result.data.childEventName,
      }),
    };
  }
  return { ...result };
};
