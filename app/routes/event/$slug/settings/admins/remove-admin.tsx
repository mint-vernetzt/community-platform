import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import { getEventBySlug, removeAdminFromEvent } from "./remove-admin.server";
import { getIsTeamMember } from "../../utils.server";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";

const schema = z.object({
  profileId: z.string(),
});

export const removeAdminSchema = schema;

const environmentSchema = z.object({
  adminCount: z.number(),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (environment.adminCount === 1) {
      throw t("error.adminCount");
    }

    return values;
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const t = await i18next.getFixedT(request, [
    "routes/event/settings/admins/remove-admin",
  ]);
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const slug = getParamValueOrThrow(params, "slug");
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  const event = await getEventBySlug(slug);
  invariantResponse(event, t("error.notFound"), { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { adminCount: event._count.admins },
  });

  if (result.success === true) {
    await removeAdminFromEvent(event.id, result.data.profileId);
    if (sessionUser.id === result.data.profileId) {
      const isTeamMember = await getIsTeamMember(event.id, sessionUser.id);
      if (event.published || isTeamMember) {
        return redirect(`/event/${slug}`);
      } else {
        return redirect("/dashboard");
      }
    }
  }
  return json(result, { headers: response.headers });
};
