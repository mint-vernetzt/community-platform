import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import fs from "fs-extra";
import Handlebars from "handlebars";

// Mailer configuration
type MailerOptions = {
  host: string;
  port: number;
  auth?: {
    user: string;
    pass: string;
  };
};

export const mailerOptions = {
  host: process.env.MAILER_HOST,
  port: parseInt(process.env.MAILER_PORT),
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS,
  },
};

export async function mailer(
  options: MailerOptions,
  from: Mail.Options["from"],
  to: Mail.Options["to"],
  subject: Mail.Options["subject"],
  text: Mail.Options["text"],
  html: Mail.Options["html"]
) {
  const transporter = nodemailer.createTransport(
    options.auth?.user !== ""
      ? options
      : { host: options.host, port: options.port }
  );

  await transporter
    .sendMail({
      from,
      to,
      subject,
      text,
      html,
    })
    .catch((error) => {
      throw new Error(error);
    });
}

// Message configuration
type StandardMessageContent = {
  headline: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
};

type MoveToParticipantsContent = {
  recipient: {
    firstName: string;
    lastName: string;
  };
  event: {
    name: string;
    url: string;
    startDate: string;
    startTime: string;
    supportContact: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
};

type WelcomeContent = {
  firstName: string;
  email: string;
};

type AbuseReportSupportContent = {
  reporter: {
    url: string;
    email: string;
  };
  entityUrl: string;
  reasons: string[];
};

type InviteContent = {
  firstName: string;
  organization: { name: string };
  button: {
    url: string;
    text: string;
  };
};

type InviteAcceptedOrRejectedContent = {
  firstName: string;
  organization: { name: string };
  profile: {
    firstName: string;
    lastName: string;
  };
};

type RequestContent = {
  firstName: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  organization: { name: string };
  button: {
    url: string;
    text: string;
  };
};

type RequestCanceledContent = {
  firstName: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  organization: { name: string };
};

type RequestAcceptedOrRejectedContent = {
  firstName: string;
  organization: { name: string };
};

type RequestNetworkContent = {
  firstName: string;
  organization: { name: string };
  network: { name: string };
  button: {
    url: string;
    text: string;
  };
};

type RequestNetworkAcceptedOrRejectedContent = {
  firstName: string;
  network: { name: string };
};

type RequestCanceledNetworkContent = {
  firstName: string;
  organization: { name: string };
  network: { name: string };
};

type InviteNetworkContent = {
  firstName: string;
  organization: { name: string };
  network: { name: string };
  button: {
    url: string;
    text: string;
  };
};

type InviteNetworkAcceptedOrRejectedContent = {
  firstName: string;
  organization: { name: string };
  network: { name: string };
};

type InviteCanceledNetworkContent = {
  firstName: string;
  organization: { name: string };
  network: { name: string };
};

type TemplatePath =
  | "mail-templates/standard-message/html.hbs"
  | "mail-templates/standard-message/text.hbs"
  | "mail-templates/welcome/html.hbs"
  | "mail-templates/welcome/text.hbs"
  | "mail-templates/abuse-report-support/html.hbs"
  | "mail-templates/abuse-report-support/text.hbs"
  | "mail-templates/move-to-participants/html.hbs"
  | "mail-templates/move-to-participants/text.hbs"
  | "mail-templates/requests/organization-to-add-profile/html.hbs"
  | "mail-templates/requests/organization-to-add-profile/text.hbs"
  | "mail-templates/requests/organization-to-add-profile/accepted-html.hbs"
  | "mail-templates/requests/organization-to-add-profile/accepted-text.hbs"
  | "mail-templates/requests/organization-to-add-profile/canceled-html.hbs"
  | "mail-templates/requests/organization-to-add-profile/canceled-text.hbs"
  | "mail-templates/requests/organization-to-add-profile/rejected-html.hbs"
  | "mail-templates/requests/organization-to-add-profile/rejected-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/html.hbs"
  | "mail-templates/invites/profile-to-join-organization/text.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/accepted-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/accepted-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/rejected-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/rejected-text.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-html.hbs"
  | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-text.hbs"
  | "mail-templates/requests/network-to-add-organization/html.hbs"
  | "mail-templates/requests/network-to-add-organization/text.hbs"
  | "mail-templates/requests/network-to-add-organization/accepted-html.hbs"
  | "mail-templates/requests/network-to-add-organization/accepted-text.hbs"
  | "mail-templates/requests/network-to-add-organization/rejected-html.hbs"
  | "mail-templates/requests/network-to-add-organization/rejected-text.hbs"
  | "mail-templates/requests/network-to-add-organization/canceled-html.hbs"
  | "mail-templates/requests/network-to-add-organization/canceled-text.hbs"
  | "mail-templates/invites/organization-to-join-network/text.hbs"
  | "mail-templates/invites/organization-to-join-network/html.hbs"
  | "mail-templates/invites/organization-to-join-network/accepted-text.hbs"
  | "mail-templates/invites/organization-to-join-network/accepted-html.hbs"
  | "mail-templates/invites/organization-to-join-network/rejected-text.hbs"
  | "mail-templates/invites/organization-to-join-network/rejected-html.hbs"
  | "mail-templates/invites/organization-to-join-network/canceled-text.hbs"
  | "mail-templates/invites/organization-to-join-network/canceled-html.hbs";

type TemplateContent<TemplatePath> = TemplatePath extends
  | "mail-templates/standard-message/html.hbs"
  | "mail-templates/standard-message/text.hbs"
  ? StandardMessageContent
  : TemplatePath extends
      | "mail-templates/move-to-participants/html.hbs"
      | "mail-templates/move-to-participants/text.hbs"
  ? MoveToParticipantsContent
  : TemplatePath extends
      | "mail-templates/welcome/html.hbs"
      | "mail-templates/welcome/text.hbs"
  ? WelcomeContent
  : TemplatePath extends
      | "mail-templates/abuse-report-support/html.hbs"
      | "mail-templates/abuse-report-support/text.hbs"
  ? AbuseReportSupportContent
  : TemplatePath extends
      | "mail-templates/invites/profile-to-join-organization/text.hbs"
      | "mail-templates/invites/profile-to-join-organization/html.hbs"
      | "mail-templates/invites/profile-to-join-organization/as-admin-text.hbs"
      | "mail-templates/invites/profile-to-join-organization/as-admin-html.hbs"
  ? InviteContent
  : TemplatePath extends
      | "mail-templates/invites/profile-to-join-organization/accepted-html.hbs"
      | "mail-templates/invites/profile-to-join-organization/accepted-text.hbs"
      | "mail-templates/invites/profile-to-join-organization/rejected-html.hbs"
      | "mail-templates/invites/profile-to-join-organization/rejected-text.hbs"
      | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-html.hbs"
      | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-text.hbs"
      | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-html.hbs"
      | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-text.hbs"
  ? InviteAcceptedOrRejectedContent
  : TemplatePath extends
      | "mail-templates/requests/organization-to-add-profile/html.hbs"
      | "mail-templates/requests/organization-to-add-profile/text.hbs"
  ? RequestContent
  : TemplatePath extends
      | "mail-templates/requests/organization-to-add-profile/canceled-html.hbs"
      | "mail-templates/requests/organization-to-add-profile/canceled-text.hbs"
  ? RequestCanceledContent
  : TemplatePath extends
      | "mail-templates/requests/organization-to-add-profile/accepted-html.hbs"
      | "mail-templates/requests/organization-to-add-profile/accepted-text.hbs"
      | "mail-templates/requests/organization-to-add-profile/rejected-html.hbs"
      | "mail-templates/requests/organization-to-add-profile/rejected-text.hbs"
  ? RequestAcceptedOrRejectedContent
  : TemplatePath extends
      | "mail-templates/requests/network-to-add-organization/html.hbs"
      | "mail-templates/requests/network-to-add-organization/text.hbs"
  ? RequestNetworkContent
  : TemplatePath extends
      | "mail-templates/requests/network-to-add-organization/accepted-html.hbs"
      | "mail-templates/requests/network-to-add-organization/accepted-text.hbs"
      | "mail-templates/requests/network-to-add-organization/rejected-html.hbs"
      | "mail-templates/requests/network-to-add-organization/rejected-text.hbs"
  ? RequestNetworkAcceptedOrRejectedContent
  : TemplatePath extends
      | "mail-templates/requests/network-to-add-organization/canceled-html.hbs"
      | "mail-templates/requests/network-to-add-organization/canceled-text.hbs"
  ? RequestCanceledNetworkContent
  : TemplatePath extends
      | "mail-templates/invites/organization-to-join-network/html.hbs"
      | "mail-templates/invites/organization-to-join-network/text.hbs"
  ? InviteNetworkContent
  : TemplatePath extends
      | "mail-templates/invites/organization-to-join-network/accepted-html.hbs"
      | "mail-templates/invites/organization-to-join-network/accepted-text.hbs"
      | "mail-templates/invites/organization-to-join-network/rejected-html.hbs"
      | "mail-templates/invites/organization-to-join-network/rejected-text.hbs"
  ? InviteNetworkAcceptedOrRejectedContent
  : TemplatePath extends
      | "mail-templates/invites/organization-to-join-network/canceled-html.hbs"
      | "mail-templates/invites/organization-to-join-network/canceled-text.hbs"
  ? InviteCanceledNetworkContent
  : never;

export function getCompiledMailTemplate<T extends TemplatePath>(
  templatePath: TemplatePath,
  content: TemplateContent<T>,
  type: "text" | "html" = "html"
) {
  const bodyTemplateSource = fs.readFileSync(templatePath, {
    encoding: "utf8",
  });
  const bodyTemplate = Handlebars.compile(bodyTemplateSource, {});
  const body = bodyTemplate(content);
  if (type === "text") {
    return body;
  }
  // On html templates we have header and footer (see mail-templates/layout.hbs)
  const baseUrl = process.env.COMMUNITY_BASE_URL;
  const layoutTemplateSource = fs.readFileSync("mail-templates/layout.hbs", {
    encoding: "utf8",
  });
  const layoutTemplate = Handlebars.compile(layoutTemplateSource, {});
  Handlebars.registerPartial("body", body);
  const compiledHtml = layoutTemplate({ baseUrl });

  return compiledHtml;
}
