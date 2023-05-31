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
        seekings: publicFields.includes("seekings"),
        offers: publicFields.includes("offers"),
      },
    });
  }

  console.log("Done.");
}

main().catch(console.error);
