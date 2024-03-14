import { prismaClient } from "~/prisma.server";
import { generateValidSlug } from "~/utils.server";
// import crypto from "node:crypto";

// function hashFunction(slug: string) {
//   const hash = crypto.createHash("md5").update(slug).digest("hex");
//   const hashValue = parseInt(hash, 16);
//   console.log(hash, hashValue, hashValue.toString(36));
//   return hashValue.toString(36);
// }

async function main() {
  console.log("Add slugs to areas...");

  const areas = await prismaClient.area.findMany({
    select: {
      id: true,
      name: true,
      type: true,
    },
  });

  const bulk = [];
  const areaSlugs: String[] = [];

  for (const area of areas) {
    let slug;
    if (area.type === "global" || area.type === "country") {
      slug = generateValidSlug(`${area.name}`, {
        hashFunction: (slug) => {
          // Adding underscore to enable ordering those types on top via orderBy: { slug: "asc" }
          return `_${slug}-${area.type}`;
        },
      });
    } else {
      slug = generateValidSlug(`${area.name}`, {
        hashFunction: (slug) => {
          return `${slug}-${area.type}`;
        },
      });
    }
    const update = prismaClient.area.update({
      where: { id: area.id },
      data: {
        slug,
      },
    });
    areaSlugs.push(slug);
    bulk.push(update);
  }

  const notUniqueSlugs = areaSlugs.filter((slug, index) => {
    return areaSlugs.indexOf(slug) !== index;
  });
  if (notUniqueSlugs.length > 0) {
    console.log(notUniqueSlugs);
    throw new Error("Duplicate slugs detected.");
  }

  await prismaClient.$transaction(bulk);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("done.");
  });
