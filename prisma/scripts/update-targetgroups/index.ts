import { prismaClient } from "~/prisma.server";

const ELEMENTARY = "646c5323-2b9f-40be-a284-9b13d673bc1c";
const PRIMARY = "cbbc8772-8de9-41d5-ac13-b46bf9daafed";

async function removeTargetGroupElementary() {
  const result = await prismaClient.targetGroup.deleteMany({
    where: {
      id: ELEMENTARY,
    },
  });

  return result.count;
}

async function updateEvents() {
  try {
    console.log(`Select all events with elementary school target group`);
    const eventsWithElementarySchool = await prismaClient.event.findMany({
      include: { targetGroups: true },
      where: {
        targetGroups: {
          some: {
            targetGroupId: ELEMENTARY,
          },
        },
      },
    });

    for (const event of eventsWithElementarySchool) {
      const isEventWithPrimaryTargetGroup = event.targetGroups.some(
        (tg) => tg.targetGroupId === PRIMARY
      );

      if (!isEventWithPrimaryTargetGroup) {
        console.log(
          `Adding missing primary school to event ${event.id} ${event.name}`
        );

        await prismaClient.event.update({
          where: {
            id: event.id,
          },
          data: {
            targetGroups: {
              create: {
                targetGroupId: PRIMARY,
              },
            },
          },
        });
      }
    }
  } catch (error) {
    console.error(`Error updating events: ${error}`);
    throw error;
  }
}

async function updateProjects() {
  try {
    console.log(`Select all projects with elementary school target group`);
    const projectsWithElementarySchool = await prismaClient.project.findMany({
      include: { targetGroups: true },
      where: {
        targetGroups: {
          some: {
            targetGroupId: ELEMENTARY,
          },
        },
      },
    });

    for (const project of projectsWithElementarySchool) {
      const isProjectWithPrimaryTargetGroup = project.targetGroups.some(
        (tg) => tg.targetGroupId === PRIMARY
      );

      if (!isProjectWithPrimaryTargetGroup) {
        console.log(
          `Adding missing primary school to project ${project.id} ${project.name}`
        );

        await prismaClient.project.update({
          where: {
            id: project.id,
          },
          data: {
            targetGroups: {
              create: {
                targetGroupId: PRIMARY,
              },
            },
          },
        });
      }
    }
  } catch (error) {
    console.error(`Error updating projects: ${error}`);
    throw error;
  }
}

async function main() {
  try {
    console.log(`Starting update process`);
    console.log(`Updating events`);
    await updateEvents();

    console.log(`Updating projects`);
    await updateProjects();

    console.log(`Deleting target group elementary school`);
    await removeTargetGroupElementary();

    console.log(`Update process completed successfully`);
  } catch (error) {
    console.error(`Error during update process: ${error}`);
    throw error;
  }
}

main().catch(console.error);
