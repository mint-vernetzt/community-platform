import { parseWithZod } from "@conform-to/zod";
import { type User } from "@supabase/supabase-js";
import { z } from "zod";
import {
  createAdminAuthClient,
  updateEmail,
  updatePassword,
} from "~/auth.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { changeEmailSchema, changePasswordSchema } from "./security.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export type ProfileSecurityLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["profile/$username/settings/security"];

export async function getProfileByUsername(username: string) {
  const profile = await prismaClient.profile.findUnique({
    where: { username },
    select: {
      id: true,
    },
  });

  return profile;
}

export async function changeEmail(options: {
  formData: FormData;
  sessionUser: User;
  locales: ProfileSecurityLocales;
}) {
  const { formData, sessionUser, locales } = options;

  const submission = await parseWithZod(formData, {
    schema: changeEmailSchema(locales).transform(async (data, ctx) => {
      if (data.email !== data.confirmEmail) {
        ctx.addIssue({
          code: "custom",
          message: locales.error.emailsDontMatch,
          path: ["confirmEmail"],
        });
        return z.NEVER;
      }

      const adminAuthClient = createAdminAuthClient();
      const {
        data: { users },
        error: getUsersError,
      } = await adminAuthClient.auth.admin.listUsers();
      invariantResponse(getUsersError === null, "Error while getting users", {
        status: 500,
      });

      if (users.some((user) => user.email === data.email)) {
        ctx.addIssue({
          code: "custom",
          message: locales.error.emailAlreadyUsed,
          path: ["email"],
        });
        return z.NEVER;
      }

      const { error } = await updateEmail(sessionUser, data.email);
      invariantResponse(error === null, "Error while updating email", {
        status: 500,
      });

      const [profile] = await prismaClient.$transaction([
        prismaClient.profile.findUnique({
          where: { id: sessionUser.id },
          select: {
            firstName: true,
            email: true,
          },
        }),
        prismaClient.profile.update({
          where: { id: sessionUser.id },
          data: { email: data.email },
        }),
      ]);

      invariantResponse(profile !== null, "Profile not found", { status: 404 });

      // Send email notice to old email address
      const sender = process.env.SYSTEM_MAIL_SENDER;
      const subject = locales.section.changeEmail.emailNotice.subject;
      const recipient = profile.email;
      const textTemplatePath = "mail-templates/standard-message/text.hbs";
      const htmlTemplatePath = "mail-templates/standard-message/html.hbs";
      const content = {
        headline: insertParametersIntoLocale(
          locales.section.changeEmail.emailNotice.headline,
          {
            firstName: profile.firstName,
          }
        ),
        message: insertParametersIntoLocale(
          locales.section.changeEmail.emailNotice.message,
          {
            oldEmail: profile.email,
            newEmail: data.email,
          }
        ),
        buttonText: process.env.SUPPORT_MAIL,
        buttonUrl: `mailto:${process.env.SUPPORT_MAIL}`,
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
        console.error(
          "Error while sending email notice for email change:",
          error
        );
        invariantResponse(
          false,
          "Error while sending email notice for email change",
          {
            status: 500,
          }
        );
      }

      return { ...data };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission: submission.reply() };
  }

  return {
    submission: submission.reply(),
    toast: {
      id: "change-email-toast",
      key: `${new Date().getTime()}`,
      message: locales.section.changeEmail.feedback,
    },
  };
}

export async function changePassword(options: {
  formData: FormData;
  sessionUser: User;
  locales: ProfileSecurityLocales;
}) {
  const { formData, sessionUser, locales } = options;

  const submission = await parseWithZod(formData, {
    schema: changePasswordSchema(locales).transform(async (data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: locales.error.passwordMismatch,
          path: ["confirmPassword"],
        });
        return z.NEVER;
      }

      const { error } = await updatePassword(sessionUser, data.password);
      invariantResponse(error === null, "Error while updating password", {
        status: 500,
      });

      const profile = await prismaClient.profile.findUnique({
        where: { id: sessionUser.id },
        select: {
          firstName: true,
          email: true,
        },
      });
      invariantResponse(profile !== null, "Profile not found", { status: 404 });

      // Send email notice to user
      const sender = process.env.SYSTEM_MAIL_SENDER;
      const subject = locales.section.changePassword2.emailNotice.subject;
      const recipient = profile.email;
      const textTemplatePath = "mail-templates/standard-message/text.hbs";
      const htmlTemplatePath = "mail-templates/standard-message/html.hbs";
      const content = {
        headline: insertParametersIntoLocale(
          locales.section.changePassword2.emailNotice.headline,
          {
            firstName: profile.firstName,
          }
        ),
        message: locales.section.changePassword2.emailNotice.message,
        buttonText: process.env.SUPPORT_MAIL,
        buttonUrl: `mailto:${process.env.SUPPORT_MAIL}`,
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
        console.error(
          "Error while sending email notice for password change:",
          error
        );
        invariantResponse(
          false,
          "Error while sending email notice for password change",
          {
            status: 500,
          }
        );
      }

      return { ...data };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission: submission.reply() };
  }

  return {
    submission: submission.reply(),
    toast: {
      id: "change-password-toast",
      key: `${new Date().getTime()}`,
      message: locales.section.changePassword2.feedback,
    },
  };
}
