import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProjectMode } from "~/routes/project/utils.server";
import {
  getProjectBySlug,
  removeAdminFromProject,
} from "./remove-admin.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";

const i18nNS = ["routes/project/settings/admins/remove-admin"];
export const handle = {
  i18n: i18nNS,
};

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
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/project/settings/admins/remove-admin",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "projects");
  const project = await getProjectBySlug(slug);
  invariantResponse(project, t("error.notFound"), { status: 404 });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { adminCount: project._count.admins },
  });

  if (result.success === true) {
    await removeAdminFromProject(project.id, result.data.profileId);
    if (sessionUser.id === result.data.profileId) {
      return redirect(`/project/${slug}`);
    }
  }
  return json(result, { headers: response.headers });
};
