import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import {
  getEventBySlug,
  updateParentEventRelationOrThrow,
} from "./utils.server";
import i18next from "~/i18next.server";
import { type TFunction } from "i18next";
import { detectLanguage } from "~/root.server";

const schema = z.object({
  parentEventId: z.string().optional(),
});

export const setParentSchema = schema;

const environmentSchema = z.object({
  slug: z.string(),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const event = await getEventBySlug(environment.slug);
    if (event === null) {
      throw t("error.notFound.current");
    }
    let parentEventName;
    if (values.parentEventId !== undefined) {
      const parentEvent = await getEventBySlug(values.parentEventId);
      if (parentEvent === null) {
        throw t("error.notFound.parent");
      }
      const parentStartTime = new Date(parentEvent.startTime).getTime();
      const parentEndTime = new Date(parentEvent.endTime).getTime();
      const eventStartTime = new Date(event.startTime).getTime();
      const eventEndTime = new Date(event.endTime).getTime();
      if (parentStartTime > eventStartTime || parentEndTime < eventEndTime) {
        throw new InputError(t("error.notInTime"), "parentEventId");
      }
      parentEventName = parentEvent.name;
    }
    return { ...values, parentEventName: parentEventName };
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes-event-settings-events-set-parent",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { slug: slug },
  });

  if (result.success === true) {
    await updateParentEventRelationOrThrow(slug, result.data.parentEventId);
    if (
      result.data.parentEventId !== undefined &&
      result.data.parentEventName !== undefined
    ) {
      return json({
        message: `Die Veranstaltung "${result.data.parentEventName}" ist jetzt Rahmenveranstaltung für Eure Veranstaltung.`,
      });
    } else {
      return json({
        message: t("feedback"),
      });
    }
  }
  return json(result);
};
