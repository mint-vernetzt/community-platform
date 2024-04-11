import { prismaClient } from "~/prisma.server";
import { updateFilterVectorOfEvent } from "~/routes/event/$slug/settings/utils.server";
import { updateFilterVectorOfOrganization } from "~/routes/organization/$slug/settings/utils.server";
import { updateFilterVectorOfProfile } from "~/routes/profile/$username/utils.server";
import { updateFilterVectorOfProject } from "~/routes/project/$slug/settings/utils.server";

async function main() {
  // profiles

  // const profileBulk = [];
  const profiles = await prismaClient.profile.findMany({
    select: {
      id: true,
    },
  });

  console.log(`Creating filter vectors of ${profiles.length} profiles.`);

  for await (const profile of profiles) {
    console.log(`Creating filter vector of profile ${profile.id}.`);
    await updateFilterVectorOfProfile(profile.id);
  }

  // await Promise.all(profileBulk);

  // organizations

  // const organizationBulk = [];
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
    },
  });

  console.log(
    `Creating filter vectors of ${organizations.length} organizations.`
  );

  for await (const organization of organizations) {
    console.log(`Creating filter vector of organization ${organization.id}.`);
    await updateFilterVectorOfOrganization(organization.id);
  }

  // await Promise.all(organizationBulk);

  // events

  // const eventBulk = [];
  const events = await prismaClient.event.findMany({
    select: {
      id: true,
    },
  });

  console.log(`Creating filter vectors of ${events.length} events.`);

  for await (const event of events) {
    console.log(`Creating filter vector of event ${event.id}.`);
    await updateFilterVectorOfEvent(event.id);
  }

  // await Promise.all(eventBulk);

  // projects

  // const projectBulk = [];
  const projects = await prismaClient.project.findMany({
    select: {
      id: true,
    },
  });

  console.log(`Creating filter vectors of ${projects.length} projects.`);

  for await (const project of projects) {
    console.log(`Creating filter vector of project ${project.id}.`);
    await updateFilterVectorOfProject(project.id);
  }

  // await Promise.all(projectBulk);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("\ndone.");
  });
