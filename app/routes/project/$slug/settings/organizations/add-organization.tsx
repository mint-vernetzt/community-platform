import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProjectMode } from "~/routes/project/utils.server";
import { getOrganizationById } from "../utils.server";
import { connectOrganizationToProject, getProjectBySlug } from "./utils.server";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";

const i18nNS = ["routes/project/settings/organizations/add-organization"];
export const handle = {
  i18n: i18nNS,
};

const schema = z.object({
  organizationId: z.string(),
});

export const addOrganizationSchema = schema;

const environmentSchema = z.object({
  slug: z.string(),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const organization = await getOrganizationById(values.organizationId);
    if (organization === null) {
      throw new InputError(
        t("error.inputError.doesNotExist"),
        "organizationId"
      );
    }
    const alreadyResponsible = organization.responsibleForProject.some(
      (entry) => {
        return entry.project.slug === environment.slug;
      }
    );
    if (alreadyResponsible) {
      throw new InputError(
        t("error.inputError.alreadyResponsible"),
        "organizationId"
      );
    }
    return {
      ...values,
      name: organization.name,
    };
  });
};

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/project/settings/organizations/add-organization",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProjectMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  await checkFeatureAbilitiesOrThrow(authClient, "projects");

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { slug: slug },
  });

  if (result.success === true) {
    const project = await getProjectBySlug(slug);
    invariantResponse(project, t("error.notFound"), { status: 404 });
    await connectOrganizationToProject(project.id, result.data.organizationId);
    return json(
      {
        message: t("feedback", { name: result.data.name }),
      },
      { headers: response.headers }
    );
  }
  return json(result, { headers: response.headers });
};
