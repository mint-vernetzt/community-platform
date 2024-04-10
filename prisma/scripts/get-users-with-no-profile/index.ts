import { createAdminAuthClient } from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import fs from "fs-extra";

async function main() {
  const supabaseAdminClient = createAdminAuthClient();

  const { data, error } = await supabaseAdminClient.auth.admin.listUsers({
    perPage: 3000,
  });

  if (error) {
    throw error;
  }

  const profiles = await prismaClient.profile.findMany();

  console.log(`${data.users.length} users found`);
  console.log(`${profiles.length} profiles found`);

  const usersWithoutProfile = data.users.filter((user) => {
    const profileOfUser = profiles.find((profile) => profile.id === user.id);
    return typeof profileOfUser === "undefined";
  });

  console.log(`${usersWithoutProfile.length} users without profile found`);

  let csv = "id,email,created_at,confirmed_at\n";
  for (const user of usersWithoutProfile) {
    csv += `${user.id},${user.email},${user.created_at},${user.confirmed_at}\n`;
  }

  fs.writeFile("users-without-profiles.csv", csv, "utf8");
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("done");
  });
