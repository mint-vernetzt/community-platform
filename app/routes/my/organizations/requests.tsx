import { parse } from "@conform-to/zod";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { mailer } from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { GetOrganizationsToAdd } from "./get-organizations-to-add.server";
import { i18nNS } from "../organizations";

export const schema = z.object({
  organizationId: z.string(),
  [GetOrganizationsToAdd.SearchParam]: z.string(),
});

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirect("/login?login_redirect=/my/organizations");
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    const organization = await prismaClient.organization.findFirst({
      where: {
        id: submission.value.organizationId,
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

    const result = await prismaClient.requestToOrganizationToAddProfile.create({
      data: {
        organizationId: submission.value.organizationId as string,
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

    return redirect(
      `/my/organizations?${GetOrganizationsToAdd.SearchParam}=${
        submission.value[GetOrganizationsToAdd.SearchParam]
      }`
    );
  }

  return json(submission);
}
