import { prismaClient } from "~/prisma.server";
import { updateFilterVectorOfEvent } from "~/routes/event/$slug/settings/utils.server";
import { updateFilterVectorOfOrganization } from "~/routes/organization/$slug/settings/utils.server";
import { updateFilterVectorOfProfile } from "~/routes/profile/$username/utils.server";
import { updateFilterVectorOfProject } from "~/routes/project/$slug/settings/utils.server";

async function main() {
  const bulk = [];

  // profiles

  const profiles = await prismaClient.profile.findMany({
    select: {
      id: true,
      username: true,
      offers: {
        select: {
          offer: {
            select: {
              slug: true,
            },
          },
        },
      },
      seekings: {
        select: {
          offer: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  console.log(`Creating filter vectors of ${profiles.length} profiles.`);

  for (const profile of profiles) {
    bulk.push(updateFilterVectorOfProfile(profile.id));
  }

  // organizations

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      slug: true,
      types: {
        select: {
          organizationType: {
            select: {
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  console.log(
    `Creating filter vectors of ${organizations.length} organizations.`
  );

  for (const organization of organizations) {
    bulk.push(updateFilterVectorOfOrganization(organization.id));
  }

  // events

  const events = await prismaClient.event.findMany({
    select: {
      id: true,
      slug: true,
      types: {
        select: {
          eventType: {
            select: {
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
      eventTargetGroups: {
        select: {
          eventTargetGroup: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  console.log(`Creating filter vectors of ${events.length} events.`);

  for (const event of events) {
    bulk.push(updateFilterVectorOfEvent(event.id));
  }

  // projects

  const projects = await prismaClient.project.findMany({
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
    },
  });

  console.log(`Creating filter vectors of ${projects.length} projects.`);

  for (const project of projects) {
    bulk.push(updateFilterVectorOfProject(project.id));
  }

  await Promise.all(bulk);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("\ndone.");
  });
