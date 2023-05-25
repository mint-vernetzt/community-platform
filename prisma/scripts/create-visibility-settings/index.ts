import { prismaClient } from "~/prisma";

async function main() {
  const profileVisibilities = await prismaClient.profileVisibility.findMany();

  if (profileVisibilities.length > 0) {
    console.log(
      "There are already visibility settings in the database. Aborting."
    );
    return;
  }

  const profiles = await prismaClient.profile.findMany();

  for (const profile of profiles) {
    const { publicFields } = profile;

    await prismaClient.profileVisibility.create({
      data: {
        profileId: profile.id,
        email: publicFields.includes("email"),
        position: publicFields.includes("position"),
        phone: publicFields.includes("phone"),
        skills: publicFields.includes("skills"),
        interests: publicFields.includes("interests"),
        seekings: publicFields.includes("seekings"),
        offers: publicFields.includes("offers"),
        website: publicFields.includes("website"),
        facebook: publicFields.includes("facebook"),
        linkedin: publicFields.includes("linkedin"),
        twitter: publicFields.includes("twitter"),
        youtube: publicFields.includes("youtube"),
        instagram: publicFields.includes("instagram"),
        xing: publicFields.includes("xing"),
      },
    });
  }

  console.log("Done.");
}

main().catch(console.error);
