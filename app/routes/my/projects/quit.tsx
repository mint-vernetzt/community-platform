import { parseWithZod } from "@conform-to/zod-v1";
import { type ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { redirectWithToast } from "~/toast.server";
import { i18nNS } from "../projects";
import { invariantResponse } from "~/lib/utils/response";

export const handle = {
  i18n: i18nNS,
};

export const schema = z.object({
  slug: z.string(),
  as: z.enum(["admin", "teamMember"]),
});

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const locale = await detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirect("/login?login_redirect=/my/projects");
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: schema });

  if (submission.status !== "success") {
    return json(submission.reply());
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
      console.log("last admin");

      return redirectWithToast(redirectURL.toString(), {
        key: `${submission.value.slug}-${Date.now()}`,
        level: "negative",
        message: t("quit.lastAdmin"),
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
    message: t("quit.success", {
      project: projectName,
    }),
  });
}
