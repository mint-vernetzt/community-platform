import nodemailer from "nodemailer";

type MailerOptions = {
  host: string;
  port: number;
  auth?: {
    user: string;
    pass: string;
  };
};

function renderTextTemplate<T>(o: T) {
  return Object.entries(o)
    .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
    .join("\n --- \n");
}

export async function submissionMailer<T>(
  options: MailerOptions,
  from: string,
  to: string,
  subject: string,
  submissionData: T
) {
  let transporter = nodemailer.createTransport(
    options.auth?.user !== ""
      ? options
      : { host: options.host, port: options.port }
  );

  let text = renderTextTemplate<T>(submissionData);

  await transporter
    .sendMail({
      from,
      to,
      subject,
      text,
    })
    .catch((error) => {
      throw new Error(error);
    });
}
