import { prismaClient } from "~/prisma.server";

async function main() {
  // Projects
  const projects = await prismaClient.project.findMany({
    select: {
      id: true,
      targetGroups: {
        select: {
          targetGroup: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    where: {
      targetGroups: {
        some: {},
      },
    },
  });

  if (projects.length === 0) {
    console.log("No projects found with connected target groups.");
    return;
  }

  const projectTargetGroups = await prismaClient.projectTargetGroup.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  for (const project of projects) {
    const targetGroupsThatMatchProjectTargetGroups = [];
    for (const relation of project.targetGroups) {
      if (
        projectTargetGroups.some((projectTargetGroup) => {
          return projectTargetGroup.id === relation.targetGroup.id;
        })
      ) {
        targetGroupsThatMatchProjectTargetGroups.push(relation.targetGroup.id);
      } else {
        console.log(
          `Legacy target group with title "${relation.targetGroup.title}" is not present in the new project target groups table.`
        );
      }
    }
    console.log(targetGroupsThatMatchProjectTargetGroups);
    if (targetGroupsThatMatchProjectTargetGroups.length > 0) {
      await prismaClient.project.update({
        where: {
          id: project.id,
        },
        data: {
          projectTargetGroups: {
            connectOrCreate: targetGroupsThatMatchProjectTargetGroups.map(
              (id) => {
                return {
                  where: {
                    projectTargetGroupId_projectId: {
                      projectId: project.id,
                      projectTargetGroupId: id,
                    },
                  },
                  create: {
                    projectTargetGroupId: id,
                  },
                };
              }
            ),
          },
        },
      });
    }
  }
  // Events
  const events = await prismaClient.event.findMany({
    select: {
      id: true,
      targetGroups: {
        select: {
          targetGroup: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    where: {
      targetGroups: {
        some: {},
      },
    },
  });

  if (events.length === 0) {
    console.log("No events found with connected target groups.");
    return;
  }

  const eventTargetGroups = await prismaClient.eventTargetGroup.findMany({
    select: {
      id: true,
      title: true,
    },
  });

  for (const event of events) {
    const targetGroupsThatMatchEventTargetGroups = [];
    for (const relation of event.targetGroups) {
      if (
        eventTargetGroups.some((eventTargetGroup) => {
          return eventTargetGroup.id === relation.targetGroup.id;
        })
      ) {
        targetGroupsThatMatchEventTargetGroups.push(relation.targetGroup.id);
      } else {
        console.log(
          `Legacy target group with title "${relation.targetGroup.title}" is not present in the new event target groups table.`
        );
      }
    }
    if (targetGroupsThatMatchEventTargetGroups.length > 0) {
      await prismaClient.event.update({
        where: {
          id: event.id,
        },
        data: {
          eventTargetGroups: {
            connectOrCreate: targetGroupsThatMatchEventTargetGroups.map(
              (id) => {
                return {
                  where: {
                    eventTargetGroupId_eventId: {
                      eventId: event.id,
                      eventTargetGroupId: id,
                    },
                  },
                  create: {
                    eventTargetGroupId: id,
                  },
                };
              }
            ),
          },
        },
      });
    }
  }
}

main()
  .catch(console.error)
  .finally(() => {
    prismaClient.$disconnect();
    console.log("Done.");
  });
