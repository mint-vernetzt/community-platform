import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { deriveProjectMode } from "~/routes/project/utils.server";

export async function getRedirectPathOnProtectedProjectRoute(args: {
  request: Request;
  slug: string;
  sessionUser: User | null;
  authClient?: SupabaseClient;
}) {
  const { request, slug, sessionUser } = args;
  // redirect to login if not logged in
  if (sessionUser === null) {
    // redirect to target after login
    // TODO: Maybe rename login_redirect to redirect_to everywhere?
    const url = new URL(request.url);
    return `/login?login_redirect=${url.pathname}`;
  }

  // check if admin of project and redirect to project details if not
  const mode = await deriveProjectMode(sessionUser, slug);
  if (mode !== "admin") {
    return `/project/${slug}`;
  }

  return null;
}

export async function updateFilterVectorOfProject(projectId: string) {
  const project = await prismaClient.project.findFirst({
    where: { id: projectId },
    select: {
      id: true,
      slug: true,
      disciplines: {
        select: {
          discipline: {
            select: {
              slug: true,
            },
          },
        },
      },
      additionalDisciplines: {
        select: {
          additionalDiscipline: {
            select: {
              slug: true,
            },
          },
        },
      },
      projectTargetGroups: {
        select: {
          projectTargetGroup: {
            select: {
              slug: true,
            },
          },
        },
      },
      formats: {
        select: {
          format: {
            select: {
              slug: true,
            },
          },
        },
      },
      specialTargetGroups: {
        select: {
          specialTargetGroup: {
            select: {
              slug: true,
            },
          },
        },
      },
      financings: {
        select: {
          financing: {
            select: {
              slug: true,
            },
          },
        },
      },
      areas: {
        select: {
          area: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (project !== null) {
    if (
      project.disciplines.length === 0 &&
      project.additionalDisciplines.length === 0 &&
      project.projectTargetGroups.length === 0 &&
      project.formats.length === 0 &&
      project.specialTargetGroups.length === 0 &&
      project.financings.length === 0 &&
      project.areas.length === 0
    ) {
      await prismaClient.$queryRawUnsafe(
        `update projects set filter_vector = NULL where id = '${project.id}'`
      );
    } else {
      const disciplineVectors = project.disciplines.map(
        (relation) => `discipline:${relation.discipline.slug}`
      );
      const additionalDisciplineVectors = project.additionalDisciplines.map(
        (relation) =>
          `additionalDiscipline:${relation.additionalDiscipline.slug}`
      );
      const targetGroupVectors = project.projectTargetGroups.map(
        (relation) => `projectTargetGroup:${relation.projectTargetGroup.slug}`
      );
      const formatVectors = project.formats.map(
        (relation) => `format:${relation.format.slug}`
      );
      const specialTargetGroupVectors = project.specialTargetGroups.map(
        (relation) => `specialTargetGroup:${relation.specialTargetGroup.slug}`
      );
      const financingVectors = project.financings.map(
        (relation) => `financing:${relation.financing.slug}`
      );
      const areaVectors = project.areas.map(
        (relation) => `area:${relation.area.slug}`
      );
      const vectors = [
        ...disciplineVectors,
        ...additionalDisciplineVectors,
        ...targetGroupVectors,
        ...formatVectors,
        ...specialTargetGroupVectors,
        ...financingVectors,
        ...areaVectors,
      ];
      const vectorString = `{"${vectors.join(`","`)}"}`;
      const query = `update projects set filter_vector = array_to_tsvector('${vectorString}') where id = '${project.id}'`;

      await prismaClient.$queryRawUnsafe(query);
    }
  }
}
