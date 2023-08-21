import { prismaClient } from "~/prisma.server";

export async function createProfileVisibilitySettings(opt: { force: boolean }) {
  if (opt.force) {
    await prismaClient.profileVisibility.deleteMany();
    console.log("Profile visibility settings deleted.");
  } else {
    const profileVisibilities = await prismaClient.profileVisibility.findMany();

    if (profileVisibilities.length > 0) {
      console.log(
        "There are already visibility settings in the database. Aborting."
      );
      return;
    }
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
            email: publicFields.includes("email"),
            phone: publicFields.includes("phone"),
            website: publicFields.includes("website"),
            facebook: publicFields.includes("facebook"),
            linkedin: publicFields.includes("linkedin"),
            twitter: publicFields.includes("twitter"),
            xing: publicFields.includes("xing"),
            bio: publicFields.includes("bio"),
            skills: publicFields.includes("skills"),
            interests: publicFields.includes("interests"),
            position: publicFields.includes("position"),
            instagram: publicFields.includes("instagram"),
            youtube: publicFields.includes("youtube"),
            offers: publicFields.includes("offers"),
            seekings: publicFields.includes("seekings"),
          },
        },
      },
    });
  }

  console.log("Created profile visibility settings.");
}

export async function createOrganizationVisibilitySettings(opt: {
  force: boolean;
}) {
  if (opt.force) {
    await prismaClient.organizationVisibility.deleteMany();
    console.log("Organization visibility settings deleted.");
  } else {
    const organizationVisibilities =
      await prismaClient.organizationVisibility.findMany();

    if (organizationVisibilities.length > 0) {
      console.log(
        "There are already visibility settings in the database. Aborting."
      );
      return;
    }
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
            email: publicFields.includes("email"),
            phone: publicFields.includes("phone"),
            website: publicFields.includes("website"),
            facebook: publicFields.includes("facebook"),
            linkedin: publicFields.includes("linkedin"),
            twitter: publicFields.includes("twitter"),
            xing: publicFields.includes("xing"),
            bio: publicFields.includes("bio"),
            quote: publicFields.includes("quote"),
            instagram: publicFields.includes("instagram"),
            youtube: publicFields.includes("youtube"),
            focuses: publicFields.includes("focuses"),
          },
        },
      },
    });
  }

  console.log("Created organization visibility settings.");
}

export async function createEventVisibilitySettings(opt: { force: boolean }) {
  if (opt.force) {
    await prismaClient.eventVisibility.deleteMany();
    console.log("Event visibility settings deleted.");
  } else {
    const eventVisibilities = await prismaClient.eventVisibility.findMany();

    if (eventVisibilities.length > 0) {
      console.log(
        "There are already visibility settings in the database. Aborting."
      );
      return;
    }
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

export async function createProjectVisibilitySettings(opt: { force: boolean }) {
  if (opt.force) {
    await prismaClient.projectVisibility.deleteMany();
    console.log("Project visibility settings deleted.");
  } else {
    const projectVisibilities = await prismaClient.projectVisibility.findMany();

    if (projectVisibilities.length > 0) {
      console.log(
        "There are already visibility settings in the database. Aborting."
      );
      return;
    }
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
