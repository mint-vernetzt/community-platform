import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveEventMode } from "~/routes/event/utils.server";
import {
  getEventBySlug,
  removeTeamMemberFromEvent,
} from "./remove-member.server";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";

const schema = z.object({
  profileId: z.string(),
});

export const removeMemberSchema = schema;

const environmentSchema = z.object({
  memberCount: z.number(),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    if (environment.memberCount === 1) {
      throw t("error.minimum");
    }
    return values;
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/event/settings/team/remove-member",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "events");
  const event = await getEventBySlug(slug);
  invariantResponse(event, t("error.notFound"), { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { memberCount: event._count.teamMembers },
  });

  if (result.success === true) {
    await removeTeamMemberFromEvent(event.id, result.data.profileId);
  }
  return json(result, { headers: response.headers });
};
