import { createAuthClient } from "~/auth.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

const authClient = createAuthClient(
  new Request("http://localhost/"), //TODO: localhost works for now
  new Response()
);

type AllowedEntities = "profile" | "organization" | "event" | "project";
async function migrateImageForEntity(entityName: AllowedEntities) {
  let transactions = [];

  // @ts-ignore
  const entities = await prismaClient[entityName].findMany();
  for (const entity of entities) {
    if (entity.background) {
      const publicUrl = getPublicURL(authClient, entity.background);
      // @ts-ignore
      const transaction = prismaClient[entityName].update({
        where: {
          id: entity.id,
        },
        data: {
          backgroundImage: {
            connectOrCreate: {
              create: {
                path: entity.background ?? "",
                url: publicUrl,
              },
              where: {
                id: entity.id,
              },
            },
          },
        },
      });

      transactions.push(transaction);
    }
  }
  if (transactions.length > 0) {
    await prismaClient.$transaction(transactions);
  }
}

async function main() {
  console.log("Migrating background images...");

  await migrateImageForEntity("profile");
  await migrateImageForEntity("event");
  await migrateImageForEntity("organization");
  await migrateImageForEntity("project");

  console.log("Done.");
}

main().catch(console.error);
