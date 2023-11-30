import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProjectMode } from "~/routes/project/utils.server";
import {
  disconnectOrganizationFromProject,
  getProjectBySlug,
} from "./utils.server";
import i18next from "~/i18next.server";

const i18nNS = ["routes/project/settings/organizations/remove-organization"];
export const handle = {
  i18n: i18nNS,
};

const schema = z.object({
  organizationId: z.string(),
});

export const removeOrganizationSchema = schema;

const mutation = makeDomainFunction(schema)(async (values) => {
  return values;
});

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/project/settings/organizations/remove-organization",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "projects");

  const result = await performMutation({ request, schema, mutation });

  if (result.success === true) {
    const project = await getProjectBySlug(slug);
    invariantResponse(project, t("error.notFound"), { status: 404 });
    await disconnectOrganizationFromProject(
      project.id,
      result.data.organizationId
    );
  }
  return json(result, { headers: response.headers });
};
