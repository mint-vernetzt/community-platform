import { type Profile } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { getCompiledMailTemplate, mailer } from "~/mailer.server";
import { prismaClient } from "~/prisma.server";

export async function createProfile(user: User) {
  if (
    user.email !== undefined &&
    typeof user.user_metadata.username === "string" &&
    typeof user.user_metadata.firstName === "string" &&
    typeof user.user_metadata.lastName === "string" &&
    (typeof user.user_metadata.academicTitle === "string" ||
      user.user_metadata.academicTitle === null) &&
    typeof user.user_metadata.termsAccepted === "boolean"
  ) {
    const initialProfile = {
      id: user.id,
      email: user.email,
      username: user.user_metadata.username,
      firstName: user.user_metadata.firstName,
      lastName: user.user_metadata.lastName,
      academicTitle: user.user_metadata.academicTitle,
      termsAccepted: user.user_metadata.termsAccepted,
    };
    // Creates the profile and its corrsponding profileVisibility with default values defined in prisma.schema
    const profile = await prismaClient.profile.create({
      select: {
        id: true,
        username: true,
        firstName: true,
        email: true,
      },
      data: {
        profileVisibility: {
          create: {},
        },
        notificationSettings: {
          create: {},
        },
        ...initialProfile,
      },
    });
    return profile;
  }
  return null;
}

export async function sendWelcomeMail(
  profile: Pick<Profile, "firstName" | "email">
) {
  // TODO: i18n
  const subject = "Willkommen auf der MINTvernetzt Community-Plattform";
  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = profile.email;
  const textTemplatePath = "mail-templates/welcome/text.hbs";
  const htmlTemplatePath = "mail-templates/welcome/html.hbs";

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    profile,
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    profile,
    "html"
  );
  await mailer(mailerOptions, sender, recipient, subject, text, html);
}
