import { parseWithZod } from "@conform-to/zod-v1";
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/i18n.server";
import { redirectWithToast } from "~/toast.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export const schema = z.object({
  slug: z.string(),
});

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["my/organizations"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirect("/login?login_redirect=/my/organizations");
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: schema });
  if (submission.status !== "success") {
    return submission.reply();
  }

  const organization = await prismaClient.organization.findUnique({
    select: {
      id: true,
      name: true,
      admins: {
        select: {
          profileId: true,
        },
      },
      teamMembers: {
        select: {
          profileId: true,
        },
      },
    },
    where: {
      slug: submission.value.slug,
      OR: [
        {
          admins: {
            some: {
              profileId: sessionUser.id,
            },
          },
        },
        {
          teamMembers: {
            some: {
              profileId: sessionUser.id,
            },
          },
        },
      ],
    },
  });

  invariantResponse(organization !== null, "Organization not found", {
    status: 404,
  });

  const redirectURL = new URL(
    `${process.env.COMMUNITY_BASE_URL}/my/organizations`
  );

  if (
    organization.admins.some((admin) => {
      return admin.profileId === sessionUser.id;
    }) &&
    organization.admins.length === 1
  ) {
    return redirectWithToast(redirectURL.toString(), {
      key: `${submission.value.slug}-${Date.now()}`,
      level: "negative",
      message: locales.quit.lastAdmin,
    });
  }

  const transactionQueries = [];
  if (
    organization.teamMembers.some((teamMember) => {
      return teamMember.profileId === sessionUser.id;
    })
  ) {
    transactionQueries.push(
      prismaClient.memberOfOrganization.delete({
        where: {
          profileId_organizationId: {
            profileId: sessionUser.id,
            organizationId: organization.id,
          },
        },
      })
    );
  }
  if (
    organization.admins.some((admin) => {
      return admin.profileId === sessionUser.id;
    })
  ) {
    transactionQueries.push(
      prismaClient.adminOfOrganization.delete({
        where: {
          profileId_organizationId: {
            profileId: sessionUser.id,
            organizationId: organization.id,
          },
        },
      })
    );
  }

  await prismaClient.$transaction(transactionQueries);

  return redirectWithToast(redirectURL.toString(), {
    key: `${submission.value.slug}-${Date.now()}`,
    level: "positive",
    message: insertParametersIntoLocale(locales.quit.success, {
      organization: organization.name,
    }),
  });
}
