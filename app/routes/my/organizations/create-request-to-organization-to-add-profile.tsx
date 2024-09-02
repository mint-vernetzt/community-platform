import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { detectLanguage } from "~/root.server";
import { parse } from "@conform-to/zod";
import { prismaClient } from "~/prisma.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { mailer } from "~/mailer.server";
import i18next from "~/i18next.server";

export const schema = z.object({
  organizationId: z.string(),
});

export const i18nNS = ["routes/my/organizations"];
export const handle = {
  i18n: i18nNS,
};

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirect("/login?login_redirect=/my/organizations");
  }

  console.log("hello");

  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: () => {
      return schema.transform(async (data, ctx) => {
        try {
          const organization = await prismaClient.organization.findFirst({
            where: {
              id: data.organizationId,
              AND: [
                {
                  teamMembers: {
                    none: {
                      profileId: sessionUser.id,
                    },
                  },
                  admins: {
                    none: {
                      profileId: sessionUser.id,
                    },
                  },
                },
                {
                  profileJoinInvites: {
                    none: {
                      profileId: sessionUser.id,
                    },
                  },
                },
                {
                  profileJoinRequests: {
                    none: {
                      profileId: sessionUser.id,
                    },
                  },
                },
              ],
            },
            select: {
              name: true,
              admins: {
                select: {
                  profile: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          });

          if (organization === null) {
            throw new Error(t("addOrganization.errors.alreadyInRelation"));
          }

          const result =
            await prismaClient.requestToOrganizationToAddProfile.create({
              data: {
                organizationId: data.organizationId,
                profileId: sessionUser.id,
                status: "pending",
              },
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            });

          const sender = process.env.SYSTEM_MAIL_SENDER;
          const subject = `${result.profile.firstName} ${result.profile.lastName} send request to join organization`;
          const recipient = organization.admins.map((admin) => {
            return admin.profile.email;
          });

          const text = `Hi admins of ${organization.name}, ${result.profile.firstName} ${result.profile.lastName} has requested to join your organization. You can contact ${result.profile.firstName} ${result.profile.lastName} at ${result.profile.email}.`;
          const html = text;

          await mailer(mailerOptions, sender, recipient, subject, text, html);
        } catch (error) {
          ctx.addIssue({
            code: "custom",
            message: t("addOrganization.errors.custom"),
          });
          return z.NEVER;
        }

        return {
          organizationsId: data.organizationId,
        };
      });
    },
    async: true,
  });

  console.log(submission);

  return json(submission);
}
