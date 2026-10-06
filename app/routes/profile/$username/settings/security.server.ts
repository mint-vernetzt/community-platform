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
  locales: {
    error: {
      emailsDoNotMatch: string;
      emailAlreadyUsed: string;
    };
    validation: {
      email: {
        required: string;
        min: string;
      };
      confirmEmail: {
        required: string;
        min: string;
      };
    };
    section: {
      changeEmail: {
        emailNotice: {
          subject: { de: string; en: string };
        };
        feedback: string;
      };
    };
  };
}) {
  const { formData, sessionUser, locales } = options;

  const submission = await parseWithZod(formData, {
    schema: changeEmailSchema(locales).transform(async (data, ctx) => {
      if (data.email !== data.confirmEmail) {
        ctx.addIssue({
          code: "custom",
          message: locales.error.emailsDoNotMatch,
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
      const recipient = profile.email;
      const textTemplatePath = "mail-templates/profile/email-changed-text.hbs";
      const htmlTemplatePath = "mail-templates/profile/email-changed-html.hbs";
      const content = {
        headline: {
          de: insertParametersIntoLocale(
            locales.section.changeEmail.emailNotice.subject.de,
            {
              firstName: profile.firstName,
            }
          ),
          en: insertParametersIntoLocale(
            locales.section.changeEmail.emailNotice.subject.en,
            {
              firstName: profile.firstName,
            }
          ),
        },
        firstName: profile.firstName,
        oldEmail: profile.email,
        newEmail: data.email,
        supportMail: process.env.SUPPORT_MAIL,
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

      const subject = `${content.headline.de} | ${content.headline.en}`;

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
    return { submission: submission };
  }

  return {
    submission: submission,
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
  locales: {
    error: {
      passwordMismatch: string;
    };
    validation: {
      password: {
        required: string;
        min: string;
      };
      confirmPassword: {
        required: string;
        min: string;
      };
    };
    section: {
      changePassword2: {
        emailNotice: {
          subject: { de: string; en: string };
        };
        feedback: string;
      };
    };
  };
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
      const recipient = profile.email;
      const textTemplatePath =
        "mail-templates/profile/password-changed-text.hbs";
      const htmlTemplatePath =
        "mail-templates/profile/password-changed-html.hbs";
      const content = {
        headline: {
          de: insertParametersIntoLocale(
            locales.section.changePassword2.emailNotice.subject.de,
            {
              firstName: profile.firstName,
            }
          ),
          en: insertParametersIntoLocale(
            locales.section.changePassword2.emailNotice.subject.en,
            {
              firstName: profile.firstName,
            }
          ),
        },
        firstName: profile.firstName,
        supportMail: process.env.SUPPORT_MAIL,
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

      const subject = `${content.headline.de} | ${content.headline.en}`;

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
    return { submission: submission };
  }

  return {
    submission: submission,
    toast: {
      id: "change-password-toast",
      key: `${new Date().getTime()}`,
      message: locales.section.changePassword2.feedback,
    },
  };
}
