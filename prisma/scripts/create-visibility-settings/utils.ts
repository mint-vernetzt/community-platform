import { prismaClient } from "~/prisma";

export async function createProfileVisibilitySettings() {
  const profileVisibilities = await prismaClient.profileVisibility.findMany();

  if (profileVisibilities.length > 0) {
    console.log(
      "There are already visibility settings in the database. Aborting."
    );
    return;
  }

  const profiles = await prismaClient.profile.findMany({
    select: {
      id: true,
      publicFields: true,
    },
  });

  for (const profile of profiles) {
    const { publicFields } = profile;

    await prismaClient.profile.update({
      where: {
        id: profile.id,
      },
      data: {
        profileVisibility: {
          create: {
            username: publicFields.includes("username"),
            email: publicFields.includes("email"),
            phone: publicFields.includes("phone"),
            website: publicFields.includes("website"),
            avatar: publicFields.includes("avatar"),
            background: publicFields.includes("background"),
            facebook: publicFields.includes("facebook"),
            linkedin: publicFields.includes("linkedin"),
            twitter: publicFields.includes("twitter"),
            xing: publicFields.includes("xing"),
            bio: publicFields.includes("bio"),
            skills: publicFields.includes("skills"),
            interests: publicFields.includes("interests"),
            academicTitle: publicFields.includes("academicTitle"),
            createdAt: publicFields.includes("createdAt"),
            firstName: publicFields.includes("firstName"),
            lastName: publicFields.includes("lastName"),
            termsAccepted: publicFields.includes("termsAccepted"),
            termsAcceptedAt: publicFields.includes("termsAcceptedAt"),
            updatedAt: publicFields.includes("updatedAt"),
            position: publicFields.includes("position"),
            instagram: publicFields.includes("instagram"),
            youtube: publicFields.includes("youtube"),
            score: publicFields.includes("score"),
            areas: publicFields.includes("areas"),
            memberOf: publicFields.includes("memberOf"),
            offers: publicFields.includes("offers"),
            participatedEvents: publicFields.includes("participatedEvents"),
            seekings: publicFields.includes("seekings"),
            contributedEvents: publicFields.includes("contributedEvents"),
            teamMemberOfEvents: publicFields.includes("teamMemberOfEvents"),
            teamMemberOfProjects: publicFields.includes("teamMemberOfProjects"),
            waitingForEvents: publicFields.includes("waitingForEvents"),
          },
        },
      },
    });
  }

  console.log("Created profile visibility settings.");
}

export async function createOrganizationVisibilitySettings() {
  const organizationVisibilities =
    await prismaClient.organizationVisibility.findMany();

  if (organizationVisibilities.length > 0) {
    console.log(
      "There are already visibility settings in the database. Aborting."
    );
    return;
  }

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      publicFields: true,
    },
  });

  for (const organization of organizations) {
    const { publicFields } = organization;

    await prismaClient.organization.update({
      where: {
        id: organization.id,
      },
      data: {
        organizationVisibility: {
          create: {
            name: publicFields.includes("name"),
            slug: publicFields.includes("slug"),
            email: publicFields.includes("email"),
            phone: publicFields.includes("phone"),
            street: publicFields.includes("street"),
            city: publicFields.includes("city"),
            website: publicFields.includes("website"),
            logo: publicFields.includes("logo"),
            background: publicFields.includes("background"),
            facebook: publicFields.includes("facebook"),
            linkedin: publicFields.includes("linkedin"),
            twitter: publicFields.includes("twitter"),
            xing: publicFields.includes("xing"),
            bio: publicFields.includes("bio"),
            quote: publicFields.includes("quote"),
            createdAt: publicFields.includes("createdAt"),
            quoteAuthor: publicFields.includes("quoteAuthor"),
            quoteAuthorInformation: publicFields.includes(
              "quoteAuthorInformation"
            ),
            streetNumber: publicFields.includes("streetNumber"),
            supportedBy: publicFields.includes("supportedBy"),
            updatedAt: publicFields.includes("updatedAt"),
            zipCode: publicFields.includes("zipCode"),
            instagram: publicFields.includes("instagram"),
            youtube: publicFields.includes("youtube"),
            score: publicFields.includes("score"),
            areas: publicFields.includes("areas"),
            focuses: publicFields.includes("focuses"),
            networkMembers: publicFields.includes("networkMembers"),
            memberOf: publicFields.includes("memberOf"),
            teamMembers: publicFields.includes("teamMembers"),
            types: publicFields.includes("types"),
            responsibleForEvents: publicFields.includes("responsibleForEvents"),
            responsibleForProject: publicFields.includes(
              "responsibleForProject"
            ),
          },
        },
      },
    });
  }

  console.log("Created organization visibility settings.");
}

export async function createEventVisibilitySettings() {
  const eventVisibilities = await prismaClient.eventVisibility.findMany();

  if (eventVisibilities.length > 0) {
    console.log(
      "There are already visibility settings in the database. Aborting."
    );
    return;
  }

  const events = await prismaClient.event.findMany({
    select: {
      id: true,
    },
  });

  for (const event of events) {
    await prismaClient.event.update({
      where: {
        id: event.id,
      },
      data: {
        eventVisibility: {
          create: {},
        },
      },
    });
  }

  console.log("Created event visibility settings.");
}

export async function createProjectVisibilitySettings() {
  const projectVisibilities = await prismaClient.projectVisibility.findMany();

  if (projectVisibilities.length > 0) {
    console.log(
      "There are already visibility settings in the database. Aborting."
    );
    return;
  }

  const projects = await prismaClient.project.findMany({
    select: {
      id: true,
    },
  });

  for (const project of projects) {
    await prismaClient.project.update({
      where: {
        id: project.id,
      },
      data: {
        projectVisibility: {
          create: {},
        },
      },
    });
  }

  console.log("Created project visibility settings.");
}
