import { prismaClient } from "~/prisma.server";
import { updateFilterVectorOfEvent } from "~/routes/event/$slug/settings/utils.server";
import { updateFilterVectorOfOrganization } from "~/routes/organization/$slug/settings/utils.server";
import { updateFilterVectorOfProfile } from "~/routes/profile/$username/utils.server";
import { updateFilterVectorOfProject } from "~/routes/project/$slug/settings/utils.server";

async function main() {
  // profiles

  const profileBulk = [];
  const profiles = await prismaClient.profile.findMany({
    select: {
      id: true,
    },
  });

  console.log(`Creating filter vectors of ${profiles.length} profiles.`);

  for (const profile of profiles) {
    profileBulk.push(updateFilterVectorOfProfile(profile.id));
  }

  await Promise.all(profileBulk);

  // organizations

  const organizationBulk = [];
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
    },
  });

  console.log(
    `Creating filter vectors of ${organizations.length} organizations.`
  );

  for (const organization of organizations) {
    organizationBulk.push(updateFilterVectorOfOrganization(organization.id));
  }

  await Promise.all(organizationBulk);

  // events

  const eventBulk = [];
  const events = await prismaClient.event.findMany({
    select: {
      id: true,
    },
  });

  console.log(`Creating filter vectors of ${events.length} events.`);

  for (const event of events) {
    eventBulk.push(updateFilterVectorOfEvent(event.id));
  }

  await Promise.all(eventBulk);

  // projects

  const projectBulk = [];
  const projects = await prismaClient.project.findMany({
    select: {
      id: true,
    },
  });

  console.log(`Creating filter vectors of ${projects.length} projects.`);

  for (const project of projects) {
    projectBulk.push(updateFilterVectorOfProject(project.id));
  }

  await Promise.all(projectBulk);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("\ndone.");
  });
