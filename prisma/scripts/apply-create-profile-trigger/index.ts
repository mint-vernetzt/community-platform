import type { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { program } from "commander";
import { prismaClient } from "~/prisma";

program
  .name("apply-create-profile-trigger")
  .description(
    `CLI tool to apply the create profile trigger which creates a profile on the public table when a user is created on the auth.users table.`
  )
  .version("1.0.0");

program.parse();

async function main() {
  try {
    await prismaClient.$queryRaw`
        create or replace function public.create_profile_of_new_user()
        returns trigger as $$
        begin
          insert into public.profiles (id, username, email, first_name, last_name, academic_title, terms_accepted)
          values (new.id, new.raw_user_meta_data->>'username', new.email, new.raw_user_meta_data->>'firstName', new.raw_user_meta_data->>'lastName', new.raw_user_meta_data->>'academicTitle', Cast(new.raw_user_meta_data->>'termsAccepted' as Boolean));
          return new;
        end;
        $$ language plpgsql security definer;
      `;
    console.log(
      'Succesfully created function "create_profile_of_new_user" which will be executed by the trigger "on_auth_user_created".'
    );
  } catch (e: any) {
    let error: PrismaClientKnownRequestError = e;
    console.log(error);
  }

  try {
    await prismaClient.$queryRaw`drop trigger if exists on_auth_user_created on auth.users;`;
    await prismaClient.$queryRaw`create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.create_profile_of_new_user();`;
    console.log(
      'Succesfully applied trigger "on_auth_user_created" which executes the function "create_profile_of_new_user" everytime a user is inserted into the auth.users table.'
    );
  } catch (e: any) {
    let error: PrismaClientKnownRequestError = e;
    console.log(error);
  }
}

main();
