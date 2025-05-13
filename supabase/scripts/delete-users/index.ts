import { createClient } from "@supabase/supabase-js";
import { program } from "commander";
import { config } from "dotenv";

config({ path: "./.env" });

program
  .name("empty-buckets")
  .description(`CLI tool to empty the storage buckets on supabase.`)
  .version("1.0.0");

program.parse();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY;
  if (supabaseUrl === undefined) {
    throw new Error(
      "No SUPABASE_URL provided via the .env file. Buckets could not be created."
    );
  }
  if (supabaseServiceRoleKey === undefined) {
    throw new Error(
      "No SERVICE_ROLE_KEY provided via the .env file. Buckets could not be created."
    );
  }
  const authClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const {
    data: { users },
    error: listUsersError,
  } = await authClient.auth.admin.listUsers();
  let partialUserList = users;
  let error = listUsersError;
  while (partialUserList.length !== 0) {
    if (error !== null || partialUserList.length === 0) {
      console.error(
        "Could not fetch already existing users from auth.users table. Skipped deleting all users from auth.users table. Either there were no users in auth.users table before running this script or the users could not be fetched."
      );
    } else {
      for (const user of partialUserList) {
        const { error: deleteUserError } =
          await authClient.auth.admin.deleteUser(user.id);
        if (deleteUserError !== null) {
          console.error(
            `The user with the id "${user.id}" and the email "${user.email}" could not be deleted. Please try to manually delete it (f.e. via Supabase Studio).`
          );
        }
        console.log(`Successfully deleted user: ${user.email}`);
      }
    }
    const {
      data: { users },
      error: listUsersError,
    } = await authClient.auth.admin.listUsers();
    partialUserList = users;
    error = listUsersError;
  }
}

main();
