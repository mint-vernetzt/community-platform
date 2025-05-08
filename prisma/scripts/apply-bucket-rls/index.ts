import type { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { createClient } from "@supabase/supabase-js";
import { program } from "commander";
import { config } from "dotenv";
import { prismaClient } from "~/prisma.server";

config({ path: "./.env" });

program
  .name("apply-bucket-rls")
  .description(
    `CLI tool to apply row level security policies on the supabase buckets.`
  )
  .version("1.0.0");

program.parse();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY;
  if (supabaseUrl === undefined) {
    throw new Error(
      "No SUPABASE_URL provided via the .env file. RLS could not be applied to buckets."
    );
  }
  if (supabaseServiceRoleKey === undefined) {
    throw new Error(
      "No SERVICE_ROLE_KEY provided via the .env file. RLS could not be applied to buckets."
    );
  }
  const authClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: imageBucketData } = await authClient.storage.getBucket(
    "images"
  );
  if (imageBucketData === null) {
    console.log(
      `Bucket "images" does not exists. Cannot apply RLS. Please run "create-buckets" script located in "/supabase/scripts/create-buckets/index.ts" first.`
    );
  }
  const { data: documentBucketData } = await authClient.storage.getBucket(
    "documents"
  );
  if (documentBucketData !== null) {
    console.log(
      `Bucket "documents" does not exists. Cannot apply RLS. Please run "create-buckets" script located in "/supabase/scripts/create-buckets/index.ts" first.`
    );
  }

  try {
    await prismaClient.$queryRaw`
      create policy "anyone can access images"
        on storage.objects for select
        using ( bucket_id = 'images' );
    `;
    console.log(
      'Succesfully applied RLS policy "anyone can access images" to bucket "images".'
    );
    // TODO: fix any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const error: PrismaClientKnownRequestError = e;
    if (
      error.code === "P2010" &&
      error.meta !== undefined &&
      error.meta.code === "42710" &&
      error.meta.message ===
        'db error: ERROR: policy "anyone can access images" for table "objects" already exists'
    ) {
      console.log(
        'The RLS policy "anyone can access images" is already applied to bucket "images". Skipping this RLS application.'
      );
    }
  }

  try {
    await prismaClient.$queryRaw`
      create policy "authenticated user can upload images"
        on storage.objects for insert
        to authenticated
        with check ( bucket_id = 'images' );
    `;
    console.log(
      'Succesfully applied RLS policy "authenticated user can upload images" to bucket "images".'
    );
    // TODO: fix any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const error: PrismaClientKnownRequestError = e;
    if (
      error.code === "P2010" &&
      error.meta !== undefined &&
      error.meta.code === "42710" &&
      error.meta.message ===
        'db error: ERROR: policy "authenticated user can upload images" for table "objects" already exists'
    ) {
      console.log(
        'The RLS policy "authenticated user can upload images" is already applied to bucket "images". Skipping this RLS application.'
      );
    }
  }

  try {
    await prismaClient.$queryRaw`
      create policy "authenticated user can update images"
        on storage.objects for update
        to authenticated
        using ( bucket_id = 'images' );
    `;
    console.log(
      'Succesfully applied RLS policy "authenticated user can update images" to bucket "images".'
    );
    // TODO: fix any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const error: PrismaClientKnownRequestError = e;
    if (
      error.code === "P2010" &&
      error.meta !== undefined &&
      error.meta.code === "42710" &&
      error.meta.message ===
        'db error: ERROR: policy "authenticated user can update images" for table "objects" already exists'
    ) {
      console.log(
        'The RLS policy "authenticated user can update images" is already applied to bucket "images". Skipping this RLS application.'
      );
    }
  }

  try {
    await prismaClient.$queryRaw`
      create policy "authenticated user can access documents"
        on storage.objects for select
        to authenticated
        using ( bucket_id = 'documents' );
    `;
    console.log(
      'Succesfully applied RLS policy "authenticated user can access documents" to bucket "documents".'
    );
    // TODO: fix any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const error: PrismaClientKnownRequestError = e;
    if (
      error.code === "P2010" &&
      error.meta !== undefined &&
      error.meta.code === "42710" &&
      error.meta.message ===
        'db error: ERROR: policy "authenticated user can access documents" for table "objects" already exists'
    ) {
      console.log(
        'The RLS policy "authenticated user can access documents" is already applied to bucket "documents". Skipping this RLS application.'
      );
    }
  }

  try {
    await prismaClient.$queryRaw`
      create policy "authenticated user can upload documents"
        on storage.objects for insert
        to authenticated
        with check ( bucket_id = 'documents' );
    `;
    console.log(
      'Succesfully applied RLS policy "authenticated user can upload documents" to bucket "documents".'
    );
    // TODO: fix any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const error: PrismaClientKnownRequestError = e;
    if (
      error.code === "P2010" &&
      error.meta !== undefined &&
      error.meta.code === "42710" &&
      error.meta.message ===
        'db error: ERROR: policy "authenticated user can upload documents" for table "objects" already exists'
    ) {
      console.log(
        'The RLS policy "authenticated user can upload documents" is already applied to bucket "documents". Skipping this RLS application.'
      );
    }
  }

  try {
    await prismaClient.$queryRaw`
      create policy "authenticated user can update documents"
        on storage.objects for update
        to authenticated
        using ( bucket_id = 'documents' );
    `;
    console.log(
      'Succesfully applied RLS "authenticated user can update documents" to bucket "documents".'
    );
    // TODO: fix any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const error: PrismaClientKnownRequestError = e;
    if (
      error.code === "P2010" &&
      error.meta !== undefined &&
      error.meta.code === "42710" &&
      error.meta.message ===
        'db error: ERROR: policy "authenticated user can update documents" for table "objects" already exists'
    ) {
      console.log(
        'The RLS policy "authenticated user can update documents" is already applied to bucket "documents". Skipping this RLS application.'
      );
    }
  }

  await prismaClient.$disconnect();
}

main();
