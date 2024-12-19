import type { ActionFunctionArgs } from "@remix-run/node";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveOrganizationMode } from "../../utils.server";
import {
  type AddOrganizationAdminLocales,
  getOrganizationBySlug,
  getProfileById,
  inviteProfileToJoinOrganization,
} from "./add-admin.server";
import { detectLanguage } from "~/i18n.server";
import { getCompiledMailTemplate, mailer } from "~/mailer.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

const schema = z.object({
  profileId: z.string(),
});

const environmentSchema = z.object({
  organizationSlug: z.string(),
});

export const addAdminSchema = schema;

const createMutation = (locales: AddOrganizationAdminLocales) => {
  return makeDomainFunction(
    schema,
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileById(values.profileId);
    if (profile === null) {
      throw new InputError(locales.error.inputError.doesNotExist, "profileId");
    }
    const alreadyAdmin = profile.administeredOrganizations.some((relation) => {
      return relation.organization.slug === environment.organizationSlug;
    });
    if (alreadyAdmin) {
      throw new InputError(locales.error.inputError.alreadyAdmin, "profileId");
    }
    return {
      ...values,
      firstName: profile.firstName,
      lastName: profile.lastName,
    };
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/admins/add-admin"];
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(locales),
    environment: { organizationSlug: slug },
  });

  if (result.success) {
    const organization = await getOrganizationBySlug(slug);
    invariantResponse(organization, locales.error.notFound, { status: 404 });

    let message: string;
    let status: "error" | "success";

    const { error, value } = await inviteProfileToJoinOrganization(
      organization.id,
      result.data.profileId
    );

    if (error === null && typeof value !== "undefined") {
      const sender = process.env.SYSTEM_MAIL_SENDER;
      const subject = locales.email.subject;
      const recipient = value.profile.email;
      const textTemplatePath =
        "mail-templates/invites/profile-to-join-organization/as-admin-text.hbs";
      const htmlTemplatePath =
        "mail-templates/invites/profile-to-join-organization/as-admin-html.hbs";
      const content = {
        firstName: value.profile.firstName,
        organization: {
          name: value.organization.name,
        },
        button: {
          url: `${process.env.COMMUNITY_BASE_URL}/my/organizations`,
          text: locales.email.button.text,
        },
      };

      const text = getCompiledMailTemplate<typeof textTemplatePath>(
        textTemplatePath,
        content,
        "text"
      );
      const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
        htmlTemplatePath,
        content,
        "html"
      );

      try {
        await mailer(mailerOptions, sender, recipient, subject, text, html);
      } catch (error) {
        invariantResponse(false, "Server Error: Mailer", { status: 500 });
      }

      message = insertParametersIntoLocale(locales.invite.success, {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      });
      status = "success";
    } else {
      message = locales.invite.error;
      status = "error";
    }

    return {
      message,
      status,
    };
  }

  return result;
};
