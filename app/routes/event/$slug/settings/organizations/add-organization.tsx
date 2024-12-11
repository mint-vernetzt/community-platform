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
import { getOrganizationById } from "../utils.server";
import { connectOrganizationToEvent, getEventBySlug } from "./utils.server";
import i18next from "~/i18next.server";
import { type TFunction } from "i18next";
import { detectLanguage } from "~/root.server";

const schema = z.object({
  organizationId: z.string(),
});

export const addOrganizationSchema = schema;

const environmentSchema = z.object({
  eventSlug: z.string(),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const organization = await getOrganizationById(values.organizationId);
    if (organization === null) {
      throw new InputError(t("error.notFound"), "organizationId");
    }
    const alreadyResponsible = organization.responsibleForEvents.some(
      (entry) => {
        return entry.event.slug === environment.eventSlug;
      }
    );
    if (alreadyResponsible) {
      throw new InputError(t("error.inputError"), "organizationId");
    }
    return { ...values, name: organization.name };
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes-event-settings-organizations-add-organization",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
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
    invariantResponse(event, "Event not found", { status: 404 });
    await connectOrganizationToEvent(event.id, result.data.organizationId);
    return json({
      message: t("feedback", { title: result.data.name }),
    });
  }
  return json(result);
};
