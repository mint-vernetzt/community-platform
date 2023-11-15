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
  addAdminToEvent,
  getEventBySlug,
  getProfileById,
} from "./add-admin.server";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";

const schema = z.object({
  profileId: z.string(),
});

const environmentSchema = z.object({
  eventSlug: z.string(),
});

export const addAdminSchema = schema;

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);
    if (profile === null) {
      throw new InputError(t("error.inputError.doesNotExist"), "profileId");
    }
    const alreadyAdmin = profile.administeredEvents.some((relation) => {
      return relation.event.slug === environment.eventSlug;
    });
    if (alreadyAdmin) {
      throw new InputError(t("error.inputError.alreadyAdmin"), "profileId");
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
    "routes/event/settings/admins/add-admin",
  ]);
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { eventSlug: slug },
  });

  if (result.success === true) {
    const event = await getEventBySlug(slug);
    invariantResponse(event, t("error.notFound"), { status: 404 });
    await addAdminToEvent(event.id, result.data.profileId);

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
