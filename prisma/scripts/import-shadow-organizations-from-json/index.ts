import { program } from "commander";
import { z } from "zod";
import fs from "fs-extra";
import { prismaClient } from "~/prisma.server";
import { generateOrganizationSlug, triggerEntityScore } from "~/utils.server";
import { updateFilterVectorOfOrganization } from "~/routes/organization/$slug/settings/utils.server";

program.requiredOption(
  "-f, --file <file>",
  "The json file that contains the shadow organizations."
);

program.parse(process.argv);

const options = program.opts();

const schema = z.array(
  z.object({
    source: z.string().url(),
    name: z.string(),
    city: z.string().nullable(),
    zipCode: z.string().nullable(),
    street: z.string().nullable(),
    streetNumber: z.string().nullable(),
    longitude: z.string().nullable(),
    latitude: z.string().nullable(),
    instagram: z.string().nullable(),
    youtube: z.string().nullable(),
    mastodon: z.string().nullable(),
    tiktok: z.string().nullable(),
    facebook: z.string().nullable(),
    linkedin: z.string().nullable(),
    twitter: z.string().nullable(),
    xing: z.string().nullable(),
    website: z.string().nullable(),
  })
);

async function main() {
  // eslint-disable-next-line import/no-named-as-default-member
  const data = await fs.readJson(options.file);

  const parsedData = schema.safeParse(data);

  if (!parsedData.success) {
    console.error("Invalid data format:", parsedData.error.format());
    process.exit(1);
  }

  for (const organization of parsedData.data) {
    const { source, ...rest } = organization;
    const slug = generateOrganizationSlug(organization.name);

    const createdOrganization = await prismaClient.organization.create({
      select: { id: true },
      data: {
        ...rest,
        slug,
        shadow: true,
        shadowSource: source,
      },
    });

    await updateFilterVectorOfOrganization(createdOrganization.id);
    await triggerEntityScore({
      entity: "organization",
      where: { id: createdOrganization.id },
    });
  }
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
