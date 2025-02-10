import type { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { program } from "commander";
import { prismaClient } from "~/prisma.server";

program
  .name("apply-create-profile-trigger")
  .description(
    `CLI tool to apply the create profile trigger which creates a profile on the public table when a user is created on the auth.users table.`
  )
  .version("1.0.0");

program.parse();

async function main() {
  try {
    await prismaClient.$queryRaw`drop trigger if exists on_auth_user_created on auth.users;`;
    console.log('Succesfully dropped trigger "on_auth_user_created".');
    // TODO: fix any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const error: PrismaClientKnownRequestError = e;
    console.log(error);
  }
  try {
    await prismaClient.$queryRaw`
        drop function if exists public.create_profile_of_new_user();
      `;
    console.log('Succesfully dropped function "create_profile_of_new_user".');
    // TODO: fix any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const error: PrismaClientKnownRequestError = e;
    console.log(error);
  }
}

main();
