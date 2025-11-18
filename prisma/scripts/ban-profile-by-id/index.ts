import { program } from "commander";
import inquirer from "inquirer";
import { createAdminAuthClient } from "~/auth.server";
import { prismaClient } from "~/prisma.server";

program.option("--id <id>", "The ID of the profile to ban.");

program.parse(process.argv);

const options = program.opts();

async function main() {
  if (typeof options.id === "undefined") {
    const optionsAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "id",
        message: "Enter the ID of the profile to ban:",
      },
    ]);
    options.id = optionsAnswers.id;
  }

  const profileToBan = await prismaClient.profile.findUnique({
    where: { id: options.id },
    select: {
      username: true,
      administeredEvents: {
        select: {
          event: {
            select: {
              slug: true,
              _count: {
                select: {
                  admins: true,
                },
              },
            },
          },
        },
      },
      administeredOrganizations: {
        select: {
          organization: {
            select: {
              slug: true,
              _count: {
                select: {
                  admins: true,
                },
              },
            },
          },
        },
      },
      administeredProjects: {
        select: {
          project: {
            select: {
              slug: true,
              _count: {
                select: {
                  admins: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (profileToBan === null) {
    throw new Error(`No profile found with ID ${options.id}`);
  }

  const confirmationAnswers = await inquirer.prompt([
    {
      type: "input",
      name: "confirmation",
      message: `Are you sure you want to ban the profile ${process.env.COMMUNITY_BASE_URL}/profile/${profileToBan.username} ? (y/n)`,
      validate: (input) => {
        if (input.toLowerCase() === "y" || input.toLowerCase() === "n") {
          return true;
        }
        return 'Please enter "y" or "n".';
      },
    },
  ]);

  if (confirmationAnswers.confirmation.toLowerCase() !== "y") {
    console.log("Aborting.");
    return;
  }

  const lastAdminEvents = profileToBan.administeredEvents.filter(
    ({ event }) => event._count.admins <= 1
  );
  const lastAdminOrganizations = profileToBan.administeredOrganizations.filter(
    ({ organization }) => organization._count.admins <= 1
  );
  const lastAdminProjects = profileToBan.administeredProjects.filter(
    ({ project }) => project._count.admins <= 1
  );

  if (
    lastAdminEvents.length > 0 ||
    lastAdminOrganizations.length > 0 ||
    lastAdminProjects.length > 0
  ) {
    const lastAdminAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "lastAdmin",
        message: `The profile ban will leave the following entities without an admin:\n\nEvents:\n${lastAdminEvents
          .map(
            ({ event }) =>
              `- ${process.env.COMMUNITY_BASE_URL}/event/${event.slug}/detail/about`
          )
          .join("\n")}\n\nOrganizations:\n${lastAdminOrganizations
          .map(
            ({ organization }) =>
              `- ${process.env.COMMUNITY_BASE_URL}/organization/${organization.slug}/detail/about`
          )
          .join("\n")}\n\nProjects:\n${lastAdminProjects
          .map(
            ({ project }) =>
              `- ${process.env.COMMUNITY_BASE_URL}/project/${project.slug}/detail/about`
          )
          .join("\n")}\n\nDo you want to proceed with the profile ban? (y/n)`,
        validate: (input) => {
          if (input.toLowerCase() === "y" || input.toLowerCase() === "n") {
            return true;
          }
          return 'Please enter "y" or "n".';
        },
      },
    ]);
    if (lastAdminAnswers.lastAdmin.toLowerCase() !== "y") {
      console.log("Aborting.");
      return;
    }
  }

  const profileBackup = await prismaClient.profile.findUnique({
    where: { id: options.id },
    include: {
      backgroundImage: true,
      areas: true,
      memberOf: true,
      offers: true,
      participatedEvents: true,
      seekings: true,
      contributedEvents: true,
      teamMemberOfEvents: true,
      teamMemberOfProjects: true,
      waitingForEvents: true,
      profileVisibility: true,
      administeredEvents: true,
      administeredOrganizations: true,
      administeredProjects: true,
      notificationSettings: true,
      profileAbuseReport: true,
      organizationAbuseReport: true,
      eventAbuseReport: true,
      projectAbuseReport: true,
      abuseReports: true,
      joinOrganizationRequests: true,
      joinOrganizationInvites: true,
      claimOrganizationRequests: true,
    },
  });

  if (profileBackup === null) {
    throw new Error(`No profile found with ID ${options.id}`);
  }

  const profileBackupJson = JSON.stringify(profileBackup, null, 2);

  await prismaClient.$transaction([
    prismaClient.bannedProfile.create({
      data: {
        id: profileBackup.id,
        jsonData: profileBackupJson,
      },
    }),
    prismaClient.profile.delete({
      where: { id: options.id },
    }),
  ]);

  const adminAuthClient = createAdminAuthClient();
  await adminAuthClient.auth.admin.updateUserById(options.id, {
    ban_duration: `${100 * 365 * 24}h`, // 100 years
  });
  console.log("Successfully banned profile.");
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    process.exit(0);
  });
