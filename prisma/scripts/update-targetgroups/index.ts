import { prismaClient } from "~/prisma.server";

const ELEMENTARY = "646c5323-2b9f-40be-a284-9b13d673bc1c";
const PRIMARY = "cbbc8772-8de9-41d5-ac13-b46bf9daafed";

async function removeTargetGroupElementary() {
  console.log(`Delete target group elementary school`);
  const result = await prismaClient.targetGroup.deleteMany({
    where: {
      id: ELEMENTARY,
    },
  });

  return result.count;
}

async function updateEvents() {
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

  eventsWithElementarySchool.forEach(async (event) => {
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
  });
}

async function updateProjects() {
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

  projectsWithElementarySchool.forEach(async (project) => {
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
  });
}

async function main() {
  console.log(`Update Events`);
  await updateEvents();

  console.log(`Update Projects`);
  await updateProjects();

  console.log(`Update TargetGroups`);
  await removeTargetGroupElementary();

  console.log("Done.");
}

main().catch(console.error);
