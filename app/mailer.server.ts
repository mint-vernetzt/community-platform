import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import fs from "fs-extra";
import Handlebars from "handlebars";

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
  from: string,
  to: string,
  subject: string,
  text: Mail.Options["text"],
  html: Mail.Options["html"]
) {
  let transporter = nodemailer.createTransport(
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

// Write function that takes subject, message and url and returns html (via handlebars) and text
export async function getHTMLMailTemplate(content: {
  headline: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
}) {
  const mailTemplateSource = await fs.readFileSync(
    "handlebar-templates/mvcp-mailtemplate.hbs",
    { encoding: "utf8" }
  );
  const mailTemplate = Handlebars.compile(mailTemplateSource);
  const html = mailTemplate({ ...content });
  return html;
}

export function getTextMailTemplate(content: {
  headline: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
}) {
  const text = `${content.headline}\n\n${content.message}\n${content.buttonText}: ${content.buttonUrl}\n\n\nViele Grüße\n\nDein MINTvernetzt-Team`;
  return text;
}
