import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { InputError, makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveOrganizationMode } from "../../utils.server";
import {
  getOrganizationBySlug,
  getProfileById,
  inviteProfileToJoinOrganization,
} from "./add-admin.server";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";
import { getCompiledMailTemplate, mailer } from "~/mailer.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";

const i18nNS = ["routes-organization-settings-admin-add-admin"] as const;
export const handle = {
  i18n: i18nNS,
};

const schema = z.object({
  profileId: z.string(),
});

const environmentSchema = z.object({
  organizationSlug: z.string(),
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
    const alreadyAdmin = profile.administeredOrganizations.some((relation) => {
      return relation.organization.slug === environment.organizationSlug;
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

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes-organization-settings-admins-add-admin",
  ]);
  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema,
    mutation: createMutation(t),
    environment: { organizationSlug: slug },
  });

  if (result.success) {
    const organization = await getOrganizationBySlug(slug);
    invariantResponse(organization, t("error.notFound"), { status: 404 });

    let message: string;
    let status: "error" | "success";

    const { error, value } = await inviteProfileToJoinOrganization(
      organization.id,
      result.data.profileId
    );

    if (error === null && typeof value !== "undefined") {
      const sender = process.env.SYSTEM_MAIL_SENDER;
      const subject = t("email.subject");
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
          text: t("email.button.text"),
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

      await mailer(mailerOptions, sender, recipient, subject, text, html);

      message = t("invite.success", {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      });
      status = "success";
    } else {
      message = t("invite.error");
      status = "error";
    }

    return json({
      message,
      status,
    });
  }

  return json(result);
};
