import { prismaClient } from "~/prisma.server";

async function migrateAdminsForEvents() {
  let transactions = [];

  const events = await prismaClient.event.findMany({
    select: {
      id: true,
      teamMembers: {
        select: {
          isPrivileged: true,
          profileId: true,
        },
      },
    },
    where: {
      teamMembers: {
        some: {
          isPrivileged: true,
        },
      },
    },
  });
  for (const event of events) {
    for (const teamMember of event.teamMembers) {
      if (teamMember.isPrivileged === true) {
        const transaction = prismaClient.event.update({
          where: {
            id: event.id,
          },
          data: {
            admins: {
              create: {
                profileId: teamMember.profileId,
              },
            },
          },
        });
        transactions.push(transaction);
      }
    }
  }
  if (transactions.length > 0) {
    await prismaClient.$transaction(transactions);
  }
}

async function migrateAdminsForOrganizations() {
  let transactions = [];

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      teamMembers: {
        select: {
          isPrivileged: true,
          profileId: true,
        },
      },
    },
    where: {
      teamMembers: {
        some: {
          isPrivileged: true,
        },
      },
    },
  });
  for (const organization of organizations) {
    for (const teamMember of organization.teamMembers) {
      if (teamMember.isPrivileged === true) {
        const transaction = prismaClient.organization.update({
          where: {
            id: organization.id,
          },
          data: {
            admins: {
              create: {
                profileId: teamMember.profileId,
              },
            },
          },
        });
        transactions.push(transaction);
      }
    }
  }
  if (transactions.length > 0) {
    await prismaClient.$transaction(transactions);
  }
}

async function migrateAdminsForProjects() {
  let transactions = [];

  const projects = await prismaClient.project.findMany({
    select: {
      id: true,
      teamMembers: {
        select: {
          isPrivileged: true,
          profileId: true,
        },
      },
    },
    where: {
      teamMembers: {
        some: {
          isPrivileged: true,
        },
      },
    },
  });
  for (const project of projects) {
    for (const teamMember of project.teamMembers) {
      if (teamMember.isPrivileged === true) {
        const transaction = prismaClient.project.update({
          where: {
            id: project.id,
          },
          data: {
            admins: {
              create: {
                profileId: teamMember.profileId,
              },
            },
          },
        });
        transactions.push(transaction);
      }
    }
  }
  if (transactions.length > 0) {
    await prismaClient.$transaction(transactions);
  }
}

async function main() {
  console.log("Migrating admins...");

  await migrateAdminsForEvents();
  await migrateAdminsForOrganizations();
  await migrateAdminsForProjects();

  console.log("Done.");
}

main().catch(console.error);
