import {
  createEventVisibilitySettings,
  createOrganizationVisibilitySettings,
  createProfileVisibilitySettings,
  createProjectVisibilitySettings,
} from "./utils";

async function main() {
  await createProfileVisibilitySettings();
  await createOrganizationVisibilitySettings();
  await createEventVisibilitySettings();
  await createProjectVisibilitySettings();

  console.log("Done.");
}

main().catch(console.error);
