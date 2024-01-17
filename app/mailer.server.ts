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

type TemplatePath =
  | "mail-templates/standard-message/html.hbs"
  | "mail-templates/standard-message/text.hbs"
  | "mail-templates/move-to-participants/html.hbs"
  | "mail-templates/move-to-participants/text.hbs";

type TemplateContent<TemplatePath> = TemplatePath extends
  | "mail-templates/standard-message/html.hbs"
  | "mail-templates/standard-message/text.hbs"
  ? StandardMessageContent
  : TemplatePath extends
      | "mail-templates/move-to-participants/html.hbs"
      | "mail-templates/move-to-participants/text.hbs"
  ? MoveToParticipantsContent
  : never;

export async function getCompiledMailTemplate<T extends TemplatePath>(
  templatePath: TemplatePath,
  content: TemplateContent<T>,
  baseUrl: string,
  type: "text" | "html" = "html"
) {
  const bodyTemplateSource = await fs.readFileSync(templatePath, {
    encoding: "utf8",
  });
  const bodyTemplate = Handlebars.compile(bodyTemplateSource, {});
  const body = bodyTemplate(content);
  if (type === "text") {
    return body;
  }
  // On html templates we have header and footer (see mail-templates/layout.hbs)
  const layoutTemplateSource = await fs.readFileSync(
    "mail-templates/layout.hbs",
    {
      encoding: "utf8",
    }
  );
  const layoutTemplate = Handlebars.compile(layoutTemplateSource, {});
  Handlebars.registerPartial("body", body);
  const compiledHtml = layoutTemplate({ baseUrl });

  return compiledHtml;
}
