import type { ActionFunctionArgs } from "react-router";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { getOrganizationById } from "../utils.server";
import { type AddResponsibleOrganizationToEventLocales } from "./add-organization.server";
import { connectOrganizationToEvent, getEventBySlug } from "./utils.server";

const schema = z.object({
  organizationId: z.string(),
});

export const addOrganizationSchema = schema;

const environmentSchema = z.object({
  eventSlug: z.string(),
});

const createMutation = (locales: AddResponsibleOrganizationToEventLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const organization = await getOrganizationById(values.organizationId);
    if (organization === null) {
      throw new InputError(locales.error.notFound, "organizationId");
    }
    const alreadyResponsible = organization.responsibleForEvents.some(
      (entry) => {
        return entry.event.slug === environment.eventSlug;
      }
    );
    if (alreadyResponsible) {
      throw new InputError(locales.error.inputError, "organizationId");
    }
    return { ...values, name: organization.name };
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "event/$slug/settings/organizations/add-organization"
    ];
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
    invariantResponse(event, "Event not found", { status: 404 });
    await connectOrganizationToEvent(event.id, result.data.organizationId);
    return {
      message: insertParametersIntoLocale(locales.feedback, {
        title: result.data.name,
      }),
    };
  }
  return { ...result };
};
