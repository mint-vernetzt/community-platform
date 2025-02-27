import { parseWithZod } from "@conform-to/zod-v1";
import { type ActionFunctionArgs, redirect } from "react-router";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { invariantResponse } from "~/lib/utils/response";
import { getCompiledMailTemplate, mailer } from "~/mailer.server";
import { detectLanguage } from "~/i18n.server";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import { redirectWithToast } from "~/toast.server";
import { GetOrganizationsToAdd } from "./get-organizations-to-add";
import {
  acceptRequestFromProfile,
  cancelRequestToOrganization,
  createRequestToOrganization,
  rejectRequestFromProfile,
} from "./requests.server";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export const AddToOrganizationRequest: {
  Create: "createRequest";
  Cancel: "cancelRequest";
  Reject: "rejectRequest";
  Accept: "acceptRequest";
} = {
  Create: "createRequest",
  Cancel: "cancelRequest",
  Reject: "rejectRequest",
  Accept: "acceptRequest",
};

export const schema = z.object({
  organizationId: z.string(),
  profileId: z.string().optional(),
  [GetOrganizationsToAdd.SearchParam]: z.string().optional(),
  intent: z
    .string()
    .refine(
      (intent) =>
        intent === AddToOrganizationRequest.Create ||
        intent === AddToOrganizationRequest.Cancel ||
        intent === AddToOrganizationRequest.Reject ||
        intent === AddToOrganizationRequest.Accept,
      {
        message: `Only ${AddToOrganizationRequest.Create}, ${AddToOrganizationRequest.Cancel}, ${AddToOrganizationRequest.Reject} and ${AddToOrganizationRequest.Accept} are valid intents.`,
      }
    ),
});

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["my/organizations"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirect("/login?login_redirect=/my/organizations");
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: schema });
  if (submission.status !== "success") {
    return submission.reply();
  }

  let organization;
  let profile;

  if (submission.value.intent === AddToOrganizationRequest.Create) {
    const result = await createRequestToOrganization(
      submission.value.organizationId,
      sessionUser.id
    );
    if (typeof result.error !== "undefined") {
      invariantResponse(false, "Server Error", { status: 500 });
    }
    organization = result.organization;

    const textTemplatePath =
      "mail-templates/requests/organization-to-add-profile/text.hbs";
    const htmlTemplatePath =
      "mail-templates/requests/organization-to-add-profile/html.hbs";
    const subject = locales.route.email.createRequest.subject;
    const sender = process.env.SYSTEM_MAIL_SENDER;
    try {
      await Promise.all(
        result.organization.admins.map(async (admin) => {
          const content = {
            firstName: admin.profile.firstName,
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
            },
            organization: {
              name: result.organization.name,
            },
            button: {
              text: locales.route.email.createRequest.button.text,
              url: `${process.env.COMMUNITY_BASE_URL}/my/organizations`,
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
          await mailer(
            mailerOptions,
            sender,
            admin.profile.email,
            subject,
            text,
            html
          );
        })
      );
    } catch (error) {
      console.error({ error });
      invariantResponse(false, "Server Error: Mailer", { status: 500 });
    }
  } else if (submission.value.intent === AddToOrganizationRequest.Cancel) {
    const result = await cancelRequestToOrganization(
      submission.value.organizationId,
      sessionUser.id
    );
    organization = result.organization;
  } else {
    const organizationSlug = undefined;
    const organizationMode = await deriveOrganizationMode(
      sessionUser,
      organizationSlug,
      submission.value.organizationId
    );
    invariantResponse(
      organizationMode === "admin",
      "Only admins can accept or reject requests.",
      { status: 403 }
    );
    const profileId = submission.value.profileId;
    invariantResponse(
      profileId !== undefined,
      "Profile ID is required to accept or reject requests.",
      { status: 400 }
    );
    let result;

    let textTemplatePath:
      | "mail-templates/requests/organization-to-add-profile/rejected-text.hbs"
      | "mail-templates/requests/organization-to-add-profile/accepted-text.hbs";
    let htmlTemplatePath:
      | "mail-templates/requests/organization-to-add-profile/rejected-html.hbs"
      | "mail-templates/requests/organization-to-add-profile/accepted-html.hbs";
    let subject: string;

    let content: {
      firstName: string;
      organization: { name: string };
    };

    if (submission.value.intent === AddToOrganizationRequest.Reject) {
      result = await rejectRequestFromProfile(
        submission.value.organizationId,
        profileId
      );

      content = {
        firstName: result.profile.firstName,
        organization: {
          name: result.organization.name,
        },
      };
      textTemplatePath =
        "mail-templates/requests/organization-to-add-profile/rejected-text.hbs";
      htmlTemplatePath =
        "mail-templates/requests/organization-to-add-profile/rejected-html.hbs";
      subject = locales.route.email.rejectRequest.subject;
    } else {
      result = await acceptRequestFromProfile(
        submission.value.organizationId,
        profileId
      );

      content = {
        firstName: result.profile.firstName,
        organization: {
          name: result.organization.name,
        },
      };
      textTemplatePath =
        "mail-templates/requests/organization-to-add-profile/accepted-text.hbs";
      htmlTemplatePath =
        "mail-templates/requests/organization-to-add-profile/accepted-html.hbs";
      subject = locales.route.email.acceptRequest.subject;
    }

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

    const sender = process.env.SYSTEM_MAIL_SENDER;
    const recipient = result.profile.email;
    try {
      await mailer(mailerOptions, sender, recipient, subject, text, html);
    } catch (error) {
      console.error({ error });
      invariantResponse(false, "Server Error: Mailer", { status: 500 });
    }

    profile = result.profile;
  }

  const redirectURL = new URL(
    `${process.env.COMMUNITY_BASE_URL}/my/organizations`
  );
  if (typeof submission.value[GetOrganizationsToAdd.SearchParam] === "string") {
    redirectURL.searchParams.set(
      GetOrganizationsToAdd.SearchParam,
      submission.value[GetOrganizationsToAdd.SearchParam] as string
    );
  }

  return redirectWithToast(redirectURL.toString(), {
    key: `${submission.value.intent}-${Date.now()}`,
    level:
      submission.value.intent === AddToOrganizationRequest.Create ||
      submission.value.intent === AddToOrganizationRequest.Accept
        ? "positive"
        : "neutral",
    message:
      submission.value.intent === AddToOrganizationRequest.Create ||
      submission.value.intent === AddToOrganizationRequest.Cancel
        ? insertParametersIntoLocale(
            locales.route.requests[submission.value.intent],
            {
              organization,
            }
          )
        : insertParametersIntoLocale(
            locales.route.requests[submission.value.intent],
            {
              academicTitle: profile?.academicTitle
                ? `${profile.academicTitle} `
                : "",
              firstName: profile?.firstName,
              lastName: profile?.lastName,
            }
          ),
  });
}
