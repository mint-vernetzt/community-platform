import { createClient } from "@supabase/supabase-js";
import { program } from "commander";
import * as dotenv from "dotenv";

dotenv.config({ path: "./.env" });

program
  .name("unset-oauth-on-user")
  .description("Unset oauth on a user.")
  .version("0.1.0")
  .option("-u, --userId <user>", "ID of user to unset oauth.");

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
  const adminAuthClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { userId } = program.opts();

  if (!userId) {
    console.error("User ID must be provided.");
    process.exit(1);
  }

  try {
    const response = await adminAuthClient.auth.admin.getUserById(userId);
    if (response.data.user === null) {
      console.error("User not found.");
      process.exit(1);
    }
    const userMetaData = response.data.user.user_metadata;
    const appMetaData = response.data.user.app_metadata;

    if (
      (typeof userMetaData.firstName === "undefined" ||
        typeof userMetaData.lastName === "undefined" ||
        typeof userMetaData.academicTitle === "undefined" ||
        typeof userMetaData.iss === "undefined") &&
      appMetaData.providers.includes("keycloak") === false
    ) {
      console.error(
        "User metadata does not contain required fields or keycloak isn't provider."
      );
      process.exit(1);
    }

    const { data, error } = await adminAuthClient.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          firstName: userMetaData.firstName,
          lastName: userMetaData.lastName,
          username: userMetaData.username,
          academicTitle:
            typeof userMetaData.academicTitle === "undefined"
              ? null
              : userMetaData.academicTitle,
          termsAccepted: userMetaData.termsAccepted,
        },
        app_metadata: { provider: "email", providers: ["email"] },
      }
    );
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(data);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
