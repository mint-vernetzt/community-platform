import { type Profile } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { prismaClient } from "~/prisma.server";

export async function createProfile(user: User) {
  if (
    user.email !== undefined &&
    typeof user.user_metadata.username === "string" &&
    typeof user.user_metadata.firstName === "string" &&
    typeof user.user_metadata.lastName === "string" &&
    // This caused an error on prod and stage. On stage and prod academicTitle is undefined if not set.
    // (typeof user.user_metadata.academicTitle === "string" ||
    //   user.user_metadata.academicTitle === null) &&
    typeof user.user_metadata.termsAccepted === "boolean"
  ) {
    const initialProfile = {
      id: user.id,
      email: user.email,
      username: user.user_metadata.username,
      firstName: user.user_metadata.firstName,
      lastName: user.user_metadata.lastName,
      academicTitle: user.user_metadata.academicTitle || null, // Set to null if not set
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

export async function sendWelcomeMail(options: {
  profile: Pick<Profile, "firstName" | "email">;
  locales: {
    mail: {
      subject: { de: string; en: string };
    };
  };
}) {
  const { profile, locales } = options;
  const subject = {
    de: insertParametersIntoLocale(locales.mail.subject.de, {
      firstName: profile.firstName,
    }),
    en: insertParametersIntoLocale(locales.mail.subject.en, {
      firstName: profile.firstName,
    }),
  };
  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = profile.email;
  const textTemplatePath = "mail-templates/welcome/text.hbs";
  const htmlTemplatePath = "mail-templates/welcome/html.hbs";

  const content = {
    headline: subject,
    firstName: profile.firstName,
    email: profile.email,
    url: process.env.COMMUNITY_BASE_URL,
    supportMail: process.env.SUPPORT_MAIL,
    contact: {
      firstName: process.env.CONTACT_PERSON_FIRST_NAME,
      url: process.env.CONTACT_PERSON_URL,
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
    recipient,
    `${subject.de} | ${subject.en}`,
    text,
    html
  );
}
