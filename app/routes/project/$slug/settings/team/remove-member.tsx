import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProjectMode } from "~/routes/project/utils.server";
import {
  getProjectBySlug,
  removeTeamMemberFromProject,
} from "./remove-member.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";

const i18nNS = ["routes/project/settings/team/remove-member"];
export const handle = {
  i18n: i18nNS,
};

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
      throw t("error.memberCount");
    }

    return values;
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProjectMode(sessionUser, slug);
  const t = await i18next.getFixedT(request, i18nNS);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "projects");
  const project = await getProjectBySlug(slug);
  invariantResponse(project, t("error.notFound"), { status: 404 });
  console.log(project);
  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { memberCount: project._count.teamMembers },
  });

  if (result.success === true) {
    await removeTeamMemberFromProject(project.id, result.data.profileId);
  }

  return json(result, { headers: response.headers });
};
