import { program } from "commander";
import { prismaClient } from "~/prisma.server";

program
  .name("truncate-tables")
  .description(
    `CLI tool to truncate all prisma tables except the prisma migrations table.`
  )
  .version("1.0.0");

program.parse();

async function main() {
  const tablenames = await prismaClient.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

  try {
    await prismaClient.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    console.log(`Successfully truncated tables: ${tables}`);
  } catch (error) {
    console.log({ error });
  }
}

main();
