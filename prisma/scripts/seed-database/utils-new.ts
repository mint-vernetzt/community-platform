import { faker } from "@faker-js/faker";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { fromBuffer } from "file-type";
import fs from "fs-extra";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getRandomUniqueSubset } from "~/lib/utils/array";
import type { ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "../../../app/prisma";
import { generatePathName } from "../../../app/storage.server";
import { createHashFromString } from "../../../app/utils.server";
import type { AwardStructure } from "./award-seeder";
import type { DocumentStructure } from "./document-seeder";
import type { EventStructure } from "./event-seeder";
import type { OrganizationStructure } from "./organization-seeder";
import type { ProfileStructure } from "./profile-seeder";
import type { ProjectStructure } from "./project-seeder";

export type EntitiesContainer = {
  profiles: {
    [K in ProfileStructure]: { id: string; email: string }[];
  };
  organizations: {
    [K in OrganizationStructure]: { id: string }[];
  };
  events: {
    [K in EventStructure]: { id: string }[];
  };
  projects: {
    [K in ProjectStructure]: { id: string }[];
  };
  awards: {
    [K in AwardStructure]: { id: string }[];
  };
  documents: {
    [K in DocumentStructure]: { id: string }[];
  };
  areas: Awaited<ReturnType<typeof getAllAreas>>;
  offersAndSeekings: Awaited<ReturnType<typeof getAllOffersAndSeekings>>;
  organizationTypes: Awaited<ReturnType<typeof getAllOrganizationTypes>>;
  focuses: Awaited<ReturnType<typeof getAllFocuses>>;
  targetGroups: Awaited<ReturnType<typeof getAllTargetGroups>>;
  experienceLevels: Awaited<ReturnType<typeof getAllExperienceLevels>>;
  eventTypes: Awaited<ReturnType<typeof getAllEventTypes>>;
  tags: Awaited<ReturnType<typeof getAllTags>>;
  stages: Awaited<ReturnType<typeof getAllStages>>;
  disciplines: Awaited<ReturnType<typeof getAllDisciplines>>;
};

type ImageType = "logos" | "backgrounds" | "avatars";

export function checkLocalEnvironment() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error(
      "No database url provided via the .env file. Database could not be seeded."
    );
  }
  // TODO: What defines to be in a local/production environment? Is it "localhost:" for everyone?
  if (!databaseUrl.includes("localhost:")) {
    throw new Error(
      "You are not seeding the database on a local environment. All data will be dropped when you seed the database with this script. If you intended to run this script on a production environment please use the --force flag."
    );
  }
}

export async function createSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY;
  if (supabaseUrl === undefined) {
    throw new Error(
      "No SUPABASE_URL provided via the .env file. Database could not be seeded."
    );
  }
  if (supabaseServiceRoleKey === undefined) {
    throw new Error(
      "No SERVICE_ROLE_KEY provided via the .env file. Database could not be seeded."
    );
  }
  const authClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  console.log(`Successfully created auth client`);
  return authClient;
}

export function setFakerSeed(seed: number) {
  faker.seed(seed);
}

export async function uploadImageBucketData(
  authClient: SupabaseClient<any, "public", any>,
  numberOfImages: number
) {
  let bucketData: {
    [key in ImageType]: string[];
  } = {
    avatars: [],
    logos: [],
    backgrounds: [],
  };
  let extension;
  let mimeType;

  console.log("\n--- Fetching images from @faker-js/faker image api ---\n");

  try {
    for (const imageType in bucketData) {
      for (let i = 1; i <= numberOfImages; i++) {
        const imgUrl = getImageUrl(imageType as ImageType);
        const response = await fetch(imgUrl);
        if (response.status !== 200) {
          console.error(
            `\n!!!\nUnable to fetch image from ${imgUrl}. Received status code ${response.status}: ${response.statusText}\n!!!\n`
          );
          continue;
        }
        const arrayBuffer = await (await response.blob()).arrayBuffer();
        // TODO: Validate svg
        // if (imageType === "logos") {
        //   extension = ".svg";
        //   mimeType = "image/svg+xml";
        //   console.error(
        //     "The validation of svg images is not yet implemented and therefore this image is skipped."
        //   );
        //   continue;
        // } else {
        const fileTypeResult = await fromBuffer(arrayBuffer);
        if (fileTypeResult === undefined) {
          console.error(
            "The MIME-type could not be read. The file was left out."
          );
          continue;
        }
        if (!fileTypeResult.mime.includes("image/")) {
          console.error(
            "The file is not an image as it does not have an image/* MIME-Type. The file was left out."
          );
          continue;
        }
        extension = fileTypeResult.ext;
        mimeType = fileTypeResult.mime;
        // }
        const hash = await createHashFromString(
          Buffer.from(arrayBuffer).toString()
        );
        const path = generatePathName(
          extension,
          hash,
          imageType.substring(0, imageType.length - 1)
        );
        const { error: uploadObjectError } = await authClient.storage
          .from("images")
          .upload(path, arrayBuffer, {
            upsert: true,
            contentType: mimeType,
          });
        if (uploadObjectError) {
          console.error(
            "The image could not be uploaded and was left out. Following error occured:",
            uploadObjectError
          );
          continue;
        }
        bucketData[imageType as ImageType].push(path);
        console.log(
          `Successfully fetched image from ${imgUrl} and added it to bucket images.`
        );
      }
    }
  } catch (e: any) {
    console.log(e);
    console.error(
      "\nCould not fetch images from pravatar.cc. Continueing with one fallback image.\n"
    );
    if (e.cause.code === "ENOTFOUND") {
      console.error(
        "Either you have no internet connection or the faker image server is down. Skipped fetching and uploading images to bucket."
      );
    }
    try {
      const data = await fs.readFile(
        "./public/images/default-event-background.jpg"
      );
      const fileTypeResult = await fromBuffer(data);
      if (fileTypeResult === undefined) {
        console.error(
          "The MIME-type could not be read. The file was left out."
        );
      } else if (!fileTypeResult.mime.includes("image/")) {
        console.error(
          "The file is not an image as it does not have an image/* MIME-Type. The file was left out."
        );
      } else {
        extension = fileTypeResult.ext;
        mimeType = fileTypeResult.mime;
        const hash = await createHashFromString(data.toString());
        for (const imageType in bucketData) {
          const path = generatePathName(
            extension,
            hash,
            imageType.substring(0, imageType.length - 1)
          );
          const { error: uploadObjectError } = await authClient.storage
            .from("images")
            .upload(path, data, {
              upsert: true,
              contentType: mimeType,
            });
          if (uploadObjectError) {
            console.error(
              "The image could not be uploaded and was left out. Following error occured:",
              uploadObjectError
            );
          }
          bucketData[imageType as ImageType].push(path);
          console.log(
            `Successfully added fallback ${imageType} to bucket images.`
          );
        }
      }
    } catch (err) {
      console.error(
        "\nCould not upload the fallback image. Seeding canceled, as some entities require an image.\n"
      );
      console.error(err);
      throw err;
    }
  }
  return bucketData;
}

function getImageUrl(imageType?: ImageType) {
  if (imageType === "avatars") {
    return faker.image.avatar();
  }
  if (imageType === "logos") {
    return faker.image.abstract();
    // TODO: logoIpsum (svg validation)
    // return `https://img.logoipsum.com/2${faker.datatype.number({
    //   min: 11,
    //   max: 95,
    // })}.svg`;
  }
  if (imageType === "backgrounds") {
    return faker.image.nature(1488, 480, true);
  }
  return faker.image.imageUrl();
}

export async function uploadDocumentBucketData(
  authClient: SupabaseClient<any, "public", any>,
  numberOfDocuments: number
) {
  let bucketData: {
    documents: {
      path: string;
      mimeType: string;
      filename: string;
      extension: string;
      sizeInMB: number;
    }[];
  } = {
    documents: [],
  };

  console.log("\n--- Creating fake PDFs via pdf-lib ---\n");

  for (let i = 1; i <= numberOfDocuments; i++) {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const numberOfPages = faker.datatype.number({ min: 1, max: 10 });
    for (let j = 0; j < numberOfPages; j++) {
      const page = pdfDoc.addPage();
      const { height } = page.getSize();
      const fontSize = 30;
      page.drawText(
        faker.lorem.paragraphs(faker.datatype.number({ min: 50, max: 1000 })),
        {
          x: 50,
          y: height - 4 * fontSize,
          size: fontSize,
          font: timesRomanFont,
          color: rgb(0, 0.53, 0.71),
        }
      );
    }
    const pdfBytes = await pdfDoc.save();

    const fileTypeResult = await fromBuffer(pdfBytes);
    if (fileTypeResult === undefined) {
      console.error("The MIME-type could not be read. The file was left out.");
      continue;
    }
    if (!fileTypeResult.mime.includes("application/pdf")) {
      console.error(
        "The file is not an pdf as it does not have an application/pdf MIME-Type. The file was left out."
      );
      continue;
    }
    const hash = await createHashFromString(Buffer.from(pdfBytes).toString());
    const path = generatePathName(fileTypeResult.ext, hash, "document");
    const { error: uploadObjectError } = await authClient.storage
      .from("images")
      .upload(path, pdfBytes, {
        upsert: true,
        contentType: fileTypeResult.mime,
      });
    if (uploadObjectError) {
      console.error(
        "The image could not be uploaded and was left out. Following error occured:",
        uploadObjectError
      );
      continue;
    }
    bucketData.documents.push({
      path: path,
      mimeType: fileTypeResult.mime,
      filename: "document.pdf",
      extension: fileTypeResult.ext,
      sizeInMB: pdfBytes.length / 1_000_000,
    });
    console.log(
      `Successfully created pdf ${i} and uploaded it to bucket documents.`
    );
  }

  return bucketData;
}

export function initializeEntitiesContainer(): EntitiesContainer {
  const entities: EntitiesContainer = {
    profiles: {
      developer: [],
      standard: [],
      admin: [],
      private: [],
      public: [],
      smallest: [],
      emptyStrings: [],
      eventManager: [],
      maker: [],
      coordinator: [],
      unicode: [],
      largest: [],
    },
    organizations: {
      developer: [],
      standard: [],
      largeTeam: [],
      smallTeam: [],
      eventCompanion: [],
      projectCompanion: [],
      network: [],
      coordinator: [],
      private: [],
      public: [],
      smallest: [],
      emptyStrings: [],
      unicode: [],
      largest: [],
    },
    events: {
      developer: [],
      standard: [],
      largeTeam: [],
      smallTeam: [],
      depth2: [],
      depth3: [],
      fullParticipants: [],
      overfullParticipants: [],
      canceled: [],
      unpublished: [],
      manyDocuments: [],
      manyResponsibleOrganizations: [],
      manySpeakers: [],
      manyParticipants: [],
      smallest: [],
      emptyStrings: [],
      unicode: [],
      largest: [],
    },
    projects: {
      developer: [],
      standard: [],
      largeTeam: [],
      smallTeam: [],
      multipleAwarded: [],
      manyResponsibleOrganizations: [],
      smallest: [],
      emptyStrings: [],
      unicode: [],
      largest: [],
    },
    awards: {
      standard: [],
      smallest: [],
      emptyStrings: [],
      unicode: [],
      largest: [],
    },
    documents: {
      standard: [],
      smallest: [],
      emptyStrings: [],
      unicode: [],
      largest: [],
    },
    areas: [],
    offersAndSeekings: [],
    organizationTypes: [],
    focuses: [],
    targetGroups: [],
    experienceLevels: [],
    eventTypes: [],
    tags: [],
    stages: [],
    disciplines: [],
  };
  return entities;
}

export async function getAllAreas() {
  const areas = await prismaClient.area.findMany({
    select: {
      id: true,
    },
  });
  return areas;
}

export async function getAllOffersAndSeekings() {
  const offersAndSeekings = await prismaClient.offer.findMany({
    select: {
      id: true,
    },
  });
  return offersAndSeekings;
}

export async function getAllOrganizationTypes() {
  const organizationTypes = await prismaClient.organizationType.findMany({
    select: {
      id: true,
    },
  });
  return organizationTypes;
}

export async function getAllFocuses() {
  const focuses = await prismaClient.focus.findMany({
    select: {
      id: true,
    },
  });
  return focuses;
}

export async function getAllTargetGroups() {
  const targetGroups = await prismaClient.targetGroup.findMany({
    select: {
      id: true,
    },
  });
  return targetGroups;
}

export async function getAllExperienceLevels() {
  const experienceLevels = await prismaClient.experienceLevel.findMany({
    select: {
      id: true,
    },
  });
  return experienceLevels;
}

export async function getAllEventTypes() {
  const eventTypes = await prismaClient.eventType.findMany({
    select: {
      id: true,
    },
  });
  return eventTypes;
}

export async function getAllTags() {
  const tags = await prismaClient.tag.findMany({
    select: {
      id: true,
    },
  });
  return tags;
}

export async function getAllStages() {
  const stages = await prismaClient.stage.findMany({
    select: {
      id: true,
    },
  });
  return stages;
}

export async function getAllDisciplines() {
  const disciplines = await prismaClient.discipline.findMany({
    select: {
      id: true,
    },
  });
  return disciplines;
}

export function getRandomAvatar(
  avatars: Awaited<ReturnType<typeof uploadImageBucketData>>["avatars"]
) {
  if (avatars.length === null) {
    throw new Error("Please provide at least one avatar image.");
  }
  return avatars[
    faker.datatype.number({
      min: 0,
      max: avatars.length - 1,
    })
  ];
}

export function getRandomBackground(
  backgrounds: Awaited<ReturnType<typeof uploadImageBucketData>>["backgrounds"]
) {
  if (backgrounds.length === null) {
    throw new Error("Please provide at least one background image.");
  }
  return backgrounds[
    faker.datatype.number({
      min: 0,
      max: backgrounds.length - 1,
    })
  ];
}

export function getRandomLogo(
  logos: Awaited<ReturnType<typeof uploadImageBucketData>>["logos"]
) {
  if (logos.length === null) {
    throw new Error("Please provide at least one logo image.");
  }
  return logos[
    faker.datatype.number({
      min: 0,
      max: logos.length - 1,
    })
  ];
}

export function getRandomDocument(
  documents: Awaited<ReturnType<typeof uploadDocumentBucketData>>["documents"]
) {
  if (documents.length === null) {
    throw new Error("Please provide at least one document.");
  }
  return documents[
    faker.datatype.number({
      min: 0,
      max: documents.length - 1,
    })
  ];
}

export function getSomeRandomEntities(
  data: { id: string }[],
  limit: { min: number; max: number }
) {
  if (data.length === 0) {
    throw new Error("Cannot get some random entries when none are given");
  }
  if (limit.min <= 0) {
    throw new Error("The minimum must be greater than 0");
  }
  if (limit.min > limit.max) {
    throw new Error("The maximum must be greater than the minimum");
  }
  return getRandomUniqueSubset<ArrayElement<typeof data>>(
    data,
    faker.datatype.number({ min: limit.min, max: limit.max })
  );
}
