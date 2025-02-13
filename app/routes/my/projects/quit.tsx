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
  as: z.enum(["admin", "teamMember"]),
});

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["my/projects"];

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirect("/login?login_redirect=/my/projects");
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const redirectURL = new URL(`${process.env.COMMUNITY_BASE_URL}/my/projects`);

  let projectName: string;

  if (submission.value.as === "admin") {
    const project = await prismaClient.project.findUnique({
      select: {
        id: true,
        name: true,
        admins: {
          select: {
            profileId: true,
          },
        },
      },
      where: {
        slug: submission.value.slug,
        admins: {
          some: {
            profileId: sessionUser.id,
          },
        },
      },
    });

    invariantResponse(project !== null, "Project not found", {
      status: 404,
    });

    if (project.admins.length === 1) {
      return redirectWithToast(redirectURL.toString(), {
        key: `${submission.value.slug}-${Date.now()}`,
        level: "negative",
        message: locales.route.quit.lastAdmin,
      });
    }

    await prismaClient.adminOfProject.delete({
      where: {
        profileId_projectId: {
          profileId: sessionUser.id,
          projectId: project.id,
        },
      },
    });

    projectName = project.name;
  } else {
    const project = await prismaClient.project.findUnique({
      select: {
        id: true,
        name: true,
        teamMembers: {
          select: {
            profileId: true,
          },
        },
      },
      where: {
        slug: submission.value.slug,
        teamMembers: {
          some: {
            profileId: sessionUser.id,
          },
        },
      },
    });

    invariantResponse(project !== null, "Project not found", {
      status: 404,
    });

    await prismaClient.teamMemberOfProject.delete({
      where: {
        profileId_projectId: {
          profileId: sessionUser.id,
          projectId: project.id,
        },
      },
    });

    projectName = project.name;
  }

  return redirectWithToast(redirectURL.toString(), {
    key: `${submission.value.slug}-${Date.now()}`,
    level: "positive",
    message: insertParametersIntoLocale(locales.route.quit.success, {
      project: projectName,
    }),
  });
}
