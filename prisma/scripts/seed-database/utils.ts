import { faker } from "@faker-js/faker";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { fromBuffer } from "file-type";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  getMultipleRandomUniqueSubsets,
  getRandomUniqueSubset,
} from "../../../app/lib/utils/array";
import type { ArrayElement } from "../../../app/lib/utils/types";
import { prismaClient } from "../../../app/prisma";
import { generatePathName } from "../../../app/storage.server";
import {
  generateEventSlug,
  generateOrganizationSlug,
  generateProjectSlug,
  generateUsername as generateUsername_app,
} from "../../../app/utils";
import { createHashFromString } from "../../../app/utils.server";
import fs from "fs-extra";

type EntityData = {
  profile: Prisma.ProfileCreateArgs["data"];
  organization: Prisma.OrganizationCreateArgs["data"];
  project: Prisma.ProjectCreateArgs["data"];
  event: Prisma.EventCreateArgs["data"];
  award: Prisma.AwardCreateArgs["data"];
  document: Prisma.DocumentCreateArgs["data"];
};

type EntityTypeOnData<T> = T extends "profile"
  ? EntityData["profile"]
  : T extends "organization"
  ? EntityData["organization"]
  : T extends "project"
  ? EntityData["project"]
  : T extends "event"
  ? EntityData["event"]
  : T extends "award"
  ? EntityData["award"]
  : T extends "document"
  ? EntityData["document"]
  : never;

type EntityStructure = {
  developer: "Developer";
  standard: "Standard";
  largeTeam: "Large Team";
  smallTeam: "Small Team";
  eventCompanion: "Event Companion";
  projectCompanion: "Project Companion";
  network: "Network";
  private: "Private";
  public: "Public";
  smallest: "Smallest";
  emptyStrings: "Empty Strings";
  eventManager: "Event Manager";
  maker: "Maker";
  coordinator: "Coordinator";
  unicode: "Unicode";
  largest: "Largest";
  depth2: "Depth2";
  depth3: "Depth3";
  fullParticipants: "Full Participants";
  overfullParticipants: "Overfull Participants";
  canceled: "Canceled";
  unpublished: "Unpublished";
  manyDocuments: "Many Documents";
  multipleAwarded: "Multiple Awarded";
  manyResponsibleOrganizations: "Many Responsible Organizations";
  manySpeakers: "Many Speakers";
  manyParticipants: "Many Participants";
};

type EntityTypeOnStructure<T> = T extends "profile"
  ? EntityStructure[
      | "developer"
      | "standard"
      | "private"
      | "public"
      | "smallest"
      | "emptyStrings"
      | "eventManager"
      | "maker"
      | "coordinator"
      | "unicode"
      | "largest"]
  : T extends "organization"
  ? EntityStructure[
      | "developer"
      | "standard"
      | "largeTeam"
      | "smallTeam"
      | "eventCompanion"
      | "projectCompanion"
      | "network"
      | "coordinator"
      | "private"
      | "public"
      | "smallest"
      | "emptyStrings"
      | "unicode"
      | "largest"]
  : T extends "project"
  ? EntityStructure[
      | "developer"
      | "standard"
      | "smallest"
      | "largeTeam"
      | "smallTeam"
      | "emptyStrings"
      | "multipleAwarded"
      | "manyResponsibleOrganizations"
      | "unicode"
      | "largest"]
  : T extends "event"
  ? EntityStructure[
      | "developer"
      | "standard"
      | "largeTeam"
      | "smallTeam"
      | "depth2"
      | "depth3"
      | "fullParticipants"
      | "overfullParticipants"
      | "canceled"
      | "unpublished"
      | "manyDocuments"
      | "manyResponsibleOrganizations"
      | "manySpeakers"
      | "manyParticipants"
      | "smallest"
      | "emptyStrings"
      | "unicode"
      | "largest"]
  : T extends "award"
  ? EntityStructure[
      | "standard"
      | "smallest"
      | "largest"
      | "emptyStrings"
      | "unicode"]
  : T extends "document"
  ? EntityStructure[
      | "standard"
      | "smallest"
      | "largest"
      | "emptyStrings"
      | "unicode"]
  : never;

type BucketData = {
  document: {
    path: string;
    mimeType: string;
    filename: string;
    extension: string;
    sizeInMB: Number;
  };
  logo?: {
    path: string;
  };
  avatar?: {
    path: string;
  };
  background?: {
    path: string;
  };
};

type EntityTypeOnBucketData<T> = T extends "document"
  ? Pick<BucketData, "document">
  : T extends "award"
  ? Required<Pick<BucketData, "logo">>
  : T extends "profile"
  ? Pick<BucketData, "avatar" | "background">
  : T extends "event"
  ? Pick<BucketData, "background">
  : T extends "organization" | "project"
  ? Pick<BucketData, "logo" | "background">
  : undefined;

type SocialMediaService =
  | "facebook"
  | "linkedin"
  | "twitter"
  | "instagram"
  | "xing"
  | "youtube";

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
      sizeInMB: Number;
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

export async function seedAllEntities(
  imageBucketData: Awaited<ReturnType<typeof uploadImageBucketData>>,
  documentBucketData: Awaited<ReturnType<typeof uploadDocumentBucketData>>,
  authClient: SupabaseClient<any, "public", any>,
  defaultPassword: string,
  useRealNames: boolean,
  numberOfEventsPerStructure: number,
  numberOfStandardEntities: number
) {
  let profileEmails: string[] = [];
  let standardProfileIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let standardOrganizationIds: Array<Awaited<ReturnType<typeof seedEntity>>> =
    [];
  let networkOrganizationIds: Array<Awaited<ReturnType<typeof seedEntity>>> =
    [];
  let standardEventIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let largestEventIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let depth2EventIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let fullParticipantEventIds: Array<Awaited<ReturnType<typeof seedEntity>>> =
    [];
  let standardProjectIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let standardAwardIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let standardDocumentIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let someProfileIds;
  let someOrganizationIds;
  let someEventIds;
  let someDocumentIds;
  let addMaximum;

  const areas = await prismaClient.area.findMany({
    select: {
      id: true,
    },
  });
  const offersAndSeekings = await prismaClient.offer.findMany({
    select: {
      id: true,
    },
  });
  const organizationTypes = await prismaClient.organizationType.findMany({
    select: {
      id: true,
    },
  });
  const focuses = await prismaClient.focus.findMany({
    select: {
      id: true,
    },
  });
  const targetGroups = await prismaClient.targetGroup.findMany({
    select: {
      id: true,
    },
  });
  const experienceLevels = await prismaClient.experienceLevel.findMany({
    select: {
      id: true,
    },
  });
  const eventTypes = await prismaClient.eventType.findMany({
    select: {
      id: true,
    },
  });
  const tags = await prismaClient.tag.findMany({
    select: {
      id: true,
    },
  });
  const stages = await prismaClient.stage.findMany({
    select: {
      id: true,
    },
  });
  const disciplines = await prismaClient.discipline.findMany({
    select: {
      id: true,
    },
  });

  // Seeding some standard profiles to add to specific entities later
  for (let i = 0; i < numberOfStandardEntities; i++) {
    const standardProfile = getEntityData<"profile">(
      "profile",
      "Standard",
      i,
      {
        avatar: {
          path: imageBucketData.avatars[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.avatars.length - 1,
            })
          ],
        },
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const standardProfileId = await seedEntity<"profile">(
      "profile",
      standardProfile,
      authClient,
      defaultPassword
    );
    await addBasicProfileRelations(standardProfileId, areas, offersAndSeekings);
    standardProfileIds.push(standardProfileId);
    profileEmails.push(standardProfile.email);
    console.log(
      `Successfully seeded standard profile with id: ${standardProfileId}`
    );
  }

  // Seeding standard organizations
  for (let i = 0; i < numberOfStandardEntities; i++) {
    const standardOrganization = getEntityData<"organization">(
      "organization",
      "Standard",
      i,
      {
        logo: {
          path: imageBucketData.logos[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.logos.length - 1,
            })
          ],
        },
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const standardOrganizationId = await seedEntity<"organization">(
      "organization",
      standardOrganization,
      authClient,
      defaultPassword
    );
    await addBasicOrganizationRelations(
      standardOrganizationId,
      areas,
      focuses,
      organizationTypes
    );
    someProfileIds = getRandomUniqueSubset<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.memberOfOrganization.createMany({
      data: [
        ...someProfileIds.map((id) => {
          return {
            profileId: id,
            organizationId: standardOrganizationId,
            isPrivileged: i % 4 === 0,
          };
        }),
      ],
    });
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.memberOfNetwork.createMany({
      data: [
        ...someOrganizationIds.map((id) => {
          return {
            networkId: i % 2 === 0 ? id : standardOrganizationId,
            networkMemberId: i % 2 === 1 ? id : standardOrganizationId,
          };
        }),
      ],
    });
    standardOrganizationIds.push(standardOrganizationId);
    console.log(
      `Successfully seeded standard organization with id: ${standardOrganizationId}`
    );
  }

  // Seeding standard documents
  for (let i = 0; i < numberOfStandardEntities; i++) {
    const standardDocument = getEntityData<"document">(
      "document",
      "Standard",
      i,
      {
        document:
          documentBucketData.documents[
            faker.datatype.number({
              min: 0,
              max: documentBucketData.documents.length - 1,
            })
          ],
      },
      useRealNames,
      numberOfStandardEntities
    );
    const standardDocumentId = await seedEntity<"document">(
      "document",
      standardDocument,
      authClient,
      defaultPassword
    );
    standardDocumentIds.push(standardDocumentId);
    console.log(
      `Successfully seeded standard document with id: ${standardDocumentId}`
    );
  }

  // Seeding standard awards
  for (let i = 0; i < numberOfStandardEntities; i++) {
    const standardAward = getEntityData<"award">(
      "award",
      "Standard",
      i,
      {
        logo: {
          path: imageBucketData.logos[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.logos.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const standardAwardId = await seedEntity<"award">(
      "award",
      standardAward,
      authClient,
      defaultPassword
    );
    standardAwardIds.push(standardAwardId);
    console.log(
      `Successfully seeded standard award with id: ${standardAwardId}`
    );
  }

  // Seeding standard events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const standardEvent = getEntityData<"event">(
      "event",
      "Standard",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const standardEventId = await seedEntity<"event">(
      "event",
      standardEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      standardEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: standardEventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: standardEventId,
          };
        }),
      ],
    });
    if (
      standardEvent.participationFrom !== undefined &&
      typeof standardEvent.participationFrom !== "string" &&
      standardEvent.participationFrom < new Date(Date.now())
    ) {
      const participantIds = someProfileIds[2].slice(
        0,
        standardEvent.participantLimit
          ? Math.round(
              standardEvent.participantLimit /
                faker.datatype.number({ min: 2, max: 10 })
            )
          : undefined
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: standardEventId,
            };
          }),
        ],
      });
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: standardEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: standardEventId,
          };
        }),
      ],
    });
    standardEventIds.push(standardEventId);
    console.log(
      `Successfully seeded standard event with id: ${standardEventId}`
    );
  }

  // Seeding standard projects
  for (let i = 0; i < numberOfStandardEntities; i++) {
    const standardProject = getEntityData<"project">(
      "project",
      "Standard",
      i,
      {
        logo: {
          path: imageBucketData.logos[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.logos.length - 1,
            })
          ],
        },
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const standardProjectId = await seedEntity<"project">(
      "project",
      standardProject,
      authClient,
      defaultPassword
    );
    await addBasicProjectRelations(
      standardProjectId,
      disciplines,
      targetGroups
    );
    someProfileIds = getRandomUniqueSubset<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.teamMemberOfProject.createMany({
      data: [
        ...someProfileIds.map((id) => {
          return {
            profileId: id,
            projectId: standardProjectId,
          };
        }),
      ],
    });
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfProject.createMany({
      data: [
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            projectId: standardProjectId,
          };
        }),
      ],
    });
    standardProjectIds.push(standardProjectId);
    console.log(
      `Successfully seeded standard project with id: ${standardProjectId}`
    );
  }

  // Seeding developer profile
  const developerProfile = getEntityData<"profile">(
    "profile",
    "Developer",
    0,
    {
      avatar: {
        path: imageBucketData.avatars[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.avatars.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const developerProfileId = await seedEntity<"profile">(
    "profile",
    developerProfile,
    authClient,
    defaultPassword
  );
  await addBasicProfileRelations(developerProfileId, areas, offersAndSeekings);
  profileEmails.push(developerProfile.email);
  console.log(
    `Successfully seeded developer profile with id: ${developerProfileId}`
  );

  // Seeding private profile
  const privateProfile = getEntityData<"profile">(
    "profile",
    "Private",
    0,
    {
      avatar: {
        path: imageBucketData.avatars[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.avatars.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const privateProfileId = await seedEntity<"profile">(
    "profile",
    privateProfile,
    authClient,
    defaultPassword
  );
  await addBasicProfileRelations(privateProfileId, areas, offersAndSeekings);
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: privateProfileId,
        organizationId: standardOrganizationIds[0],
      },
    ],
  });
  profileEmails.push(privateProfile.email);
  console.log(
    `Successfully seeded private profile with id: ${privateProfileId}`
  );

  // Seeding public profile
  const publicProfile = getEntityData<"profile">(
    "profile",
    "Public",
    0,
    {
      avatar: {
        path: imageBucketData.avatars[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.avatars.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const publicProfileId = await seedEntity<"profile">(
    "profile",
    publicProfile,
    authClient,
    defaultPassword
  );
  await addBasicProfileRelations(publicProfileId, areas, offersAndSeekings);
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: publicProfileId,
        organizationId: standardOrganizationIds[0],
      },
    ],
  });
  profileEmails.push(publicProfile.email);
  console.log(`Successfully seeded public profile with id: ${publicProfileId}`);

  // Seeding smallest profile
  const smallestProfile = getEntityData<"profile">(
    "profile",
    "Smallest",
    0,
    {
      avatar: undefined,
      background: undefined,
    },
    useRealNames,
    numberOfStandardEntities
  );
  const smallestProfileId = await seedEntity<"profile">(
    "profile",
    smallestProfile,
    authClient,
    defaultPassword
  );
  profileEmails.push(smallestProfile.email);
  console.log(
    `Successfully seeded smallest profile with id: ${smallestProfileId}`
  );

  // Seeding emptyStrings profile
  const emptyStringsProfile = getEntityData<"profile">(
    "profile",
    "Empty Strings",
    0,
    {
      avatar: {
        path: imageBucketData.avatars[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.avatars.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const emptyStringsProfileId = await seedEntity<"profile">(
    "profile",
    emptyStringsProfile,
    authClient,
    defaultPassword
  );
  await addBasicProfileRelations(
    emptyStringsProfileId,
    areas,
    offersAndSeekings
  );
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: emptyStringsProfileId,
        organizationId: standardOrganizationIds[0],
      },
    ],
  });
  profileEmails.push(emptyStringsProfile.email);
  console.log(
    `Successfully seeded empty strings profile with id: ${emptyStringsProfileId}`
  );

  // Seeding eventManager profile
  const eventManagerProfile = getEntityData<"profile">(
    "profile",
    "Event Manager",
    0,
    {
      avatar: {
        path: imageBucketData.avatars[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.avatars.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const eventManagerProfileId = await seedEntity<"profile">(
    "profile",
    eventManagerProfile,
    authClient,
    defaultPassword
  );
  await addBasicProfileRelations(
    eventManagerProfileId,
    areas,
    offersAndSeekings
  );
  await prismaClient.teamMemberOfEvent.createMany({
    data: [
      ...standardEventIds.map((id) => {
        return {
          profileId: eventManagerProfileId,
          eventId: id,
          isPrivileged: true,
        };
      }),
    ],
  });
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: eventManagerProfileId,
        organizationId: standardOrganizationIds[0],
      },
    ],
  });
  profileEmails.push(eventManagerProfile.email);
  console.log(
    `Successfully seeded event manager profile with id: ${eventManagerProfileId}`
  );

  // Seeding maker profile
  const makerProfile = getEntityData<"profile">(
    "profile",
    "Maker",
    0,
    {
      avatar: {
        path: imageBucketData.avatars[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.avatars.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const makerProfileId = await seedEntity<"profile">(
    "profile",
    makerProfile,
    authClient,
    defaultPassword
  );
  await addBasicProfileRelations(makerProfileId, areas, offersAndSeekings);
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: makerProfileId,
        organizationId: standardOrganizationIds[0],
      },
    ],
  });
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      ...standardProjectIds.map((id) => {
        return {
          profileId: makerProfileId,
          projectId: id,
          isPrivileged: true,
        };
      }),
    ],
  });
  profileEmails.push(makerProfile.email);
  console.log(`Successfully seeded maker profile with id: ${makerProfileId}`);

  // Seeding network organizations
  for (let i = 0; i < 10; i++) {
    const networkOrganization = getEntityData<"organization">(
      "organization",
      "Network",
      i,
      {
        logo: {
          path: imageBucketData.logos[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.logos.length - 1,
            })
          ],
        },
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const networkOrganizationId = await seedEntity<"organization">(
      "organization",
      networkOrganization,
      authClient,
      defaultPassword
    );
    await addBasicOrganizationRelations(
      networkOrganizationId,
      areas,
      focuses,
      organizationTypes
    );
    someProfileIds = getRandomUniqueSubset<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.memberOfOrganization.createMany({
      data: [
        ...someProfileIds.map((id) => {
          return {
            profileId: id,
            organizationId: networkOrganizationId,
          };
        }),
      ],
    });
    await prismaClient.memberOfNetwork.createMany({
      data: [
        ...standardOrganizationIds.map((id) => {
          return {
            networkMemberId: id,
            networkId: networkOrganizationId,
          };
        }),
      ],
    });
    networkOrganizationIds.push(networkOrganizationId);
    console.log(
      `Successfully seeded network organization with id: ${networkOrganizationId}`
    );
  }

  // Seeding coordinator organization
  const coordinatorOrganization = getEntityData<"organization">(
    "organization",
    "Coordinator",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const coordinatorOrganizationId = await seedEntity<"organization">(
    "organization",
    coordinatorOrganization,
    authClient,
    defaultPassword
  );
  await addBasicOrganizationRelations(
    coordinatorOrganizationId,
    areas,
    focuses,
    organizationTypes
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.memberOfOrganization.createMany({
    data: [
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: coordinatorOrganizationId,
        };
      }),
    ],
  });
  await prismaClient.memberOfNetwork.createMany({
    data: [
      ...networkOrganizationIds.map((id) => {
        return {
          networkId: id,
          networkMemberId: coordinatorOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded coordinator organization with id: ${coordinatorOrganizationId}`
  );

  // Seeding coordinator profile
  const coordinatorProfile = getEntityData<"profile">(
    "profile",
    "Coordinator",
    0,
    {
      avatar: {
        path: imageBucketData.avatars[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.avatars.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const coordinatorProfileId = await seedEntity<"profile">(
    "profile",
    coordinatorProfile,
    authClient,
    defaultPassword
  );
  await addBasicProfileRelations(
    coordinatorProfileId,
    areas,
    offersAndSeekings
  );
  someEventIds = getMultipleRandomUniqueSubsets<
    ArrayElement<typeof standardEventIds>
  >(standardEventIds, 2);
  await prismaClient.speakerOfEvent.createMany({
    data: [
      ...someEventIds[0].map((id) => {
        return {
          profileId: coordinatorProfileId,
          eventId: id,
        };
      }),
    ],
  });
  await prismaClient.participantOfEvent.createMany({
    data: [
      ...someEventIds[1].map((id) => {
        return {
          profileId: coordinatorProfileId,
          eventId: id,
        };
      }),
    ],
  });
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: coordinatorProfileId,
        organizationId: coordinatorOrganizationId,
        isPrivileged: true,
      },
      ...networkOrganizationIds.map((id) => {
        return {
          profileId: coordinatorProfileId,
          organizationId: id,
        };
      }),
    ],
  });
  profileEmails.push(coordinatorProfile.email);
  console.log(
    `Successfully seeded coordinator profile with id: ${coordinatorProfileId}`
  );

  // Seeding unicode profile
  const unicodeProfile = getEntityData<"profile">(
    "profile",
    "Unicode",
    0,
    {
      avatar: {
        path: imageBucketData.avatars[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.avatars.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const unicodeProfileId = await seedEntity<"profile">(
    "profile",
    unicodeProfile,
    authClient,
    defaultPassword
  );
  await addBasicProfileRelations(unicodeProfileId, areas, offersAndSeekings);
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: unicodeProfileId,
        organizationId: standardOrganizationIds[0],
      },
    ],
  });
  profileEmails.push(unicodeProfile.email);
  console.log(
    `Successfully seeded unicode profile with id: ${unicodeProfileId}`
  );

  // Seeding largest profile
  const largestProfile = getEntityData<"profile">(
    "profile",
    "Largest",
    0,
    {
      avatar: {
        path: imageBucketData.avatars[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.avatars.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const largestProfileId = await seedEntity<"profile">(
    "profile",
    largestProfile,
    authClient,
    defaultPassword
  );
  addMaximum = true;
  await addBasicProfileRelations(
    largestProfileId,
    areas,
    offersAndSeekings,
    addMaximum
  );
  await prismaClient.memberOfOrganization.createMany({
    data: [
      ...standardOrganizationIds.map((id) => {
        return {
          profileId: largestProfileId,
          organizationId: id,
          isPrivileged: true,
        };
      }),
    ],
  });
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      ...standardProjectIds.map((id) => {
        return {
          profileId: largestProfileId,
          projectId: id,
        };
      }),
    ],
  });
  someEventIds = getMultipleRandomUniqueSubsets<
    ArrayElement<typeof standardEventIds>
  >(standardEventIds, 3);
  await prismaClient.teamMemberOfEvent.createMany({
    data: [
      ...someEventIds[0].map((id) => {
        return {
          profileId: largestProfileId,
          eventId: id,
        };
      }),
    ],
  });
  await prismaClient.speakerOfEvent.createMany({
    data: [
      ...someEventIds[1].map((id) => {
        return {
          profileId: largestProfileId,
          eventId: id,
        };
      }),
    ],
  });
  await prismaClient.participantOfEvent.createMany({
    data: [
      ...someEventIds[2].map((id) => {
        return {
          profileId: largestProfileId,
          eventId: id,
        };
      }),
    ],
  });
  await prismaClient.waitingParticipantOfEvent.createMany({
    data: [
      ...fullParticipantEventIds.map((id) => {
        return {
          profileId: largestProfileId,
          eventId: id,
        };
      }),
    ],
  });
  profileEmails.push(largestProfile.email);
  console.log(
    `Successfully seeded largest profile with id: ${largestProfileId}`
  );

  // Seeding developer organization
  const developerOrganization = getEntityData<"organization">(
    "organization",
    "Developer",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const developerOrganizationId = await seedEntity<"organization">(
    "organization",
    developerOrganization,
    authClient,
    defaultPassword
  );
  await addBasicOrganizationRelations(
    developerOrganizationId,
    areas,
    focuses,
    organizationTypes
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: developerProfileId,
        organizationId: developerOrganizationId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: developerOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded developer organization with id: ${developerOrganizationId}`
  );

  // Seeding small team organization
  const smallTeamOrganization = getEntityData<"organization">(
    "organization",
    "Small Team",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const smallTeamOrganizationId = await seedEntity<"organization">(
    "organization",
    smallTeamOrganization,
    authClient,
    defaultPassword
  );
  await addBasicOrganizationRelations(
    smallTeamOrganizationId,
    areas,
    focuses,
    organizationTypes
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 3 }));
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: smallestProfileId,
        organizationId: smallTeamOrganizationId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: smallTeamOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded small team organization with id: ${smallTeamOrganizationId}`
  );

  // Seeding large team organization
  const largeTeamOrganization = getEntityData<"organization">(
    "organization",
    "Large Team",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const largeTeamOrganizationId = await seedEntity<"organization">(
    "organization",
    largeTeamOrganization,
    authClient,
    defaultPassword
  );
  await addBasicOrganizationRelations(
    largeTeamOrganizationId,
    areas,
    focuses,
    organizationTypes
  );
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: largestProfileId,
        organizationId: largeTeamOrganizationId,
        isPrivileged: true,
      },
      ...standardProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: largeTeamOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded large team organization with id: ${largeTeamOrganizationId}`
  );

  // Seeding smallest organization
  const smallestOrganization = getEntityData<"organization">(
    "organization",
    "Smallest",
    0,
    {
      logo: undefined,
      background: undefined,
    },
    useRealNames,
    numberOfStandardEntities
  );
  const smallestOrganizationId = await seedEntity<"organization">(
    "organization",
    smallestOrganization,
    authClient,
    defaultPassword
  );
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: smallestProfileId,
        organizationId: smallestOrganizationId,
        isPrivileged: true,
      },
    ],
  });
  console.log(
    `Successfully seeded smallest organization with id: ${smallestOrganizationId}`
  );

  // Seeding private organization
  const privateOrganization = getEntityData<"organization">(
    "organization",
    "Private",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const privateOrganizationId = await seedEntity<"organization">(
    "organization",
    privateOrganization,
    authClient,
    defaultPassword
  );
  await addBasicOrganizationRelations(
    privateOrganizationId,
    areas,
    focuses,
    organizationTypes
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: privateProfileId,
        organizationId: privateOrganizationId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: privateOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded private organization with id: ${privateOrganizationId}`
  );

  // Seeding public organization
  const publicOrganization = getEntityData<"organization">(
    "organization",
    "Public",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const publicOrganizationId = await seedEntity<"organization">(
    "organization",
    publicOrganization,
    authClient,
    defaultPassword
  );
  await addBasicOrganizationRelations(
    publicOrganizationId,
    areas,
    focuses,
    organizationTypes
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: publicProfileId,
        organizationId: publicOrganizationId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: publicOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded public organization with id: ${publicOrganizationId}`
  );

  // Seeding empty strings organization
  const emptyStringsOrganization = getEntityData<"organization">(
    "organization",
    "Empty Strings",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const emptyStringsOrganizationId = await seedEntity<"organization">(
    "organization",
    emptyStringsOrganization,
    authClient,
    defaultPassword
  );
  await addBasicOrganizationRelations(
    emptyStringsOrganizationId,
    areas,
    focuses,
    organizationTypes
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: emptyStringsProfileId,
        organizationId: emptyStringsOrganizationId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: emptyStringsOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded empty strings organization with id: ${emptyStringsOrganizationId}`
  );

  // Seeding event companion organization
  const eventCompanionOrganization = getEntityData<"organization">(
    "organization",
    "Event Companion",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const eventCompanionOrganizationId = await seedEntity<"organization">(
    "organization",
    eventCompanionOrganization,
    authClient,
    defaultPassword
  );
  await addBasicOrganizationRelations(
    eventCompanionOrganizationId,
    areas,
    focuses,
    organizationTypes
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: eventManagerProfileId,
        organizationId: eventCompanionOrganizationId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: eventCompanionOrganizationId,
        };
      }),
    ],
  });
  await prismaClient.responsibleOrganizationOfEvent.createMany({
    data: [
      ...standardEventIds.map((id) => {
        return {
          eventId: id,
          organizationId: eventCompanionOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded event companion organization with id: ${eventCompanionOrganizationId}`
  );

  // Seeding project companion organization
  const projectCompanionOrganization = getEntityData<"organization">(
    "organization",
    "Project Companion",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const projectCompanionOrganizationId = await seedEntity<"organization">(
    "organization",
    projectCompanionOrganization,
    authClient,
    defaultPassword
  );
  await addBasicOrganizationRelations(
    projectCompanionOrganizationId,
    areas,
    focuses,
    organizationTypes
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: makerProfileId,
        organizationId: projectCompanionOrganizationId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: projectCompanionOrganizationId,
        };
      }),
    ],
  });
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      ...standardProjectIds.map((id) => {
        return {
          projectId: id,
          organizationId: projectCompanionOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded project companion organization with id: ${projectCompanionOrganizationId}`
  );

  // Seeding unicode organization
  const unicodeOrganization = getEntityData<"organization">(
    "organization",
    "Unicode",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const unicodeOrganizationId = await seedEntity<"organization">(
    "organization",
    unicodeOrganization,
    authClient,
    defaultPassword
  );
  await addBasicOrganizationRelations(
    unicodeOrganizationId,
    areas,
    focuses,
    organizationTypes
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: unicodeProfileId,
        organizationId: unicodeOrganizationId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: unicodeOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded unicode organization with id: ${unicodeOrganizationId}`
  );

  // Seeding largest document
  const largestDocument = getEntityData<"document">(
    "document",
    "Largest",
    0,
    {
      document:
        documentBucketData.documents[
          faker.datatype.number({
            min: 0,
            max: documentBucketData.documents.length - 1,
          })
        ],
    },
    useRealNames,
    numberOfStandardEntities
  );
  const largestDocumentId = await seedEntity<"document">(
    "document",
    largestDocument,
    authClient,
    defaultPassword
  );
  console.log(
    `Successfully seeded largest document with id: ${largestDocumentId}`
  );

  // Seeding largest events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const largestEvent = getEntityData<"event">(
      "event",
      "Largest",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const largestEventId = await seedEntity<"event">(
      "event",
      largestEvent,
      authClient,
      defaultPassword
    );
    addMaximum = true;
    await addBasicEventRelations(
      largestEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups,
      addMaximum
    );
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: largestProfileId,
          eventId: largestEventId,
          isPrivileged: true,
        },
        ...standardProfileIds
          .slice(0, Math.round(standardProfileIds.length / 3))
          .map((id) => {
            return {
              profileId: id,
              eventId: largestEventId,
            };
          }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: largestEventId,
        },
        ...standardProfileIds
          .slice(
            Math.round(standardProfileIds.length / 3),
            Math.round((standardProfileIds.length / 3) * 2)
          )
          .map((id) => {
            return {
              profileId: id,
              eventId: largestEventId,
            };
          }),
      ],
    });
    if (
      largestEvent.participationFrom !== undefined &&
      typeof largestEvent.participationFrom !== "string" &&
      largestEvent.participationFrom < new Date(Date.now())
    ) {
      const restProfileIds = standardProfileIds.slice(
        Math.round((standardProfileIds.length / 3) * 2)
      );
      const participantIds = restProfileIds.slice(
        0,
        largestEvent.participantLimit || restProfileIds.length / 2
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: largestEventId,
          },
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: largestEventId,
            };
          }),
        ],
      });
      const waitingParticipantIds = restProfileIds.slice(
        largestEvent.participantLimit
          ? largestEvent.participantLimit
          : restProfileIds.length / 2
      );
      await prismaClient.waitingParticipantOfEvent.createMany({
        data: [
          ...waitingParticipantIds.map((id) => {
            return {
              profileId: id,
              eventId: largestEventId,
            };
          }),
        ],
      });
    }
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        ...standardOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: largestEventId,
          };
        }),
      ],
    });
    await prismaClient.documentOfEvent.createMany({
      data: [
        {
          documentId: largestDocumentId,
          eventId: largestEventId,
        },
        ...standardDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: largestEventId,
          };
        }),
      ],
    });
    largestEventIds.push(largestEventId);
    console.log(`Successfully seeded largest event with id: ${largestEventId}`);
  }

  // Seeding largest award
  const largestAward = getEntityData<"award">(
    "award",
    "Largest",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const largestAwardId = await seedEntity<"award">(
    "award",
    largestAward,
    authClient,
    defaultPassword
  );
  console.log(`Successfully seeded largest award with id: ${largestAwardId}`);

  // Seeding largest project
  const largestProject = getEntityData<"project">(
    "project",
    "Largest",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const largestProjectId = await seedEntity<"project">(
    "project",
    largestProject,
    authClient,
    defaultPassword
  );
  addMaximum = true;
  await addBasicProjectRelations(
    largestProjectId,
    disciplines,
    targetGroups,
    addMaximum
  );
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      {
        profileId: largestProfileId,
        projectId: largestProjectId,
        isPrivileged: true,
      },
      ...standardProfileIds.map((id) => {
        return {
          profileId: id,
          projectId: largestProjectId,
        };
      }),
    ],
  });
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      ...standardOrganizationIds.map((id) => {
        return {
          organizationId: id,
          projectId: largestProjectId,
        };
      }),
    ],
  });
  await prismaClient.awardOfProject.createMany({
    data: [
      {
        awardId: largestAwardId,
        projectId: largestProjectId,
      },
      ...standardAwardIds.map((id) => {
        return {
          awardId: id,
          projectId: largestProjectId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded largest project with id: ${largestProjectId}`
  );

  // Seeding largest organization
  const largestOrganization = getEntityData<"organization">(
    "organization",
    "Largest",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const largestOrganizationId = await seedEntity<"organization">(
    "organization",
    largestOrganization,
    authClient,
    defaultPassword
  );
  addMaximum = true;
  await addBasicOrganizationRelations(
    largestOrganizationId,
    areas,
    focuses,
    organizationTypes,
    addMaximum
  );
  await prismaClient.memberOfOrganization.createMany({
    data: [
      {
        profileId: largestProfileId,
        organizationId: largestOrganizationId,
        isPrivileged: true,
      },
      ...standardProfileIds.map((id) => {
        return {
          profileId: id,
          organizationId: largestOrganizationId,
        };
      }),
    ],
  });
  await prismaClient.memberOfNetwork.createMany({
    data: [
      ...standardOrganizationIds
        .slice(0, Math.round(standardOrganizationIds.length / 2))
        .map((id) => {
          return {
            networkId: id,
            networkMemberId: largestOrganizationId,
          };
        }),
      ...standardOrganizationIds
        .slice(Math.round(standardOrganizationIds.length / 2))
        .map((id) => {
          return {
            networkId: largestOrganizationId,
            networkMemberId: id,
          };
        }),
    ],
  });
  await prismaClient.responsibleOrganizationOfEvent.createMany({
    data: [
      ...largestEventIds.map((id) => {
        return {
          eventId: id,
          organizationId: largestOrganizationId,
        };
      }),
    ],
  });
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      {
        projectId: largestProjectId,
        organizationId: largestOrganizationId,
      },
      ...standardProjectIds.map((id) => {
        return {
          projectId: id,
          organizationId: largestOrganizationId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded largest organization with id: ${largestOrganizationId}`
  );

  // Seeding developer events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const developerEvent = getEntityData<"event">(
      "event",
      "Developer",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const developerEventId = await seedEntity<"event">(
      "event",
      developerEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      developerEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: developerProfileId,
          eventId: developerEventId,
          isPrivileged: true,
        },
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: developerEventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: developerEventId,
        },
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: developerEventId,
          };
        }),
      ],
    });
    if (
      developerEvent.participationFrom !== undefined &&
      typeof developerEvent.participationFrom !== "string" &&
      developerEvent.participationFrom < new Date(Date.now())
    ) {
      const participantIds = someProfileIds[2].slice(
        0,
        developerEvent.participantLimit
          ? Math.round(
              developerEvent.participantLimit /
                faker.datatype.number({ min: 2, max: 10 })
            )
          : undefined
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: developerEventId,
          },
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: developerEventId,
            };
          }),
        ],
      });
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: developerOrganizationId,
          eventId: developerEventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: developerEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: developerEventId,
          };
        }),
      ],
    });
    console.log(
      `Successfully seeded developer event with id: ${developerEventId}`
    );
  }

  // Seeding depth2 events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const depth2Event = getEntityData<"event">(
      "event",
      "Depth2",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const depth2EventId = await seedEntity<"event">(
      "event",
      depth2Event,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      depth2EventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: eventManagerProfileId,
          eventId: depth2EventId,
          isPrivileged: true,
        },
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: depth2EventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: depth2EventId,
        },
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: depth2EventId,
          };
        }),
      ],
    });
    if (
      depth2Event.participationFrom !== undefined &&
      typeof depth2Event.participationFrom !== "string" &&
      depth2Event.participationFrom < new Date(Date.now())
    ) {
      const participantIds = someProfileIds[2].slice(
        0,
        depth2Event.participantLimit
          ? Math.round(
              depth2Event.participantLimit /
                faker.datatype.number({ min: 2, max: 10 })
            )
          : undefined
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: depth2EventId,
          },
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: depth2EventId,
            };
          }),
        ],
      });
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: eventCompanionOrganizationId,
          eventId: depth2EventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: depth2EventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: depth2EventId,
          };
        }),
      ],
    });
    const childEventIds = [];
    for (let childEventId of standardEventIds) {
      const event = await prismaClient.event.findFirst({
        select: { startTime: true, endTime: true },
        where: { id: childEventId },
      });
      if (event === null) {
        continue;
      }
      if (
        new Date(event.startTime) >= new Date(depth2Event.startTime) &&
        new Date(event.startTime) <= new Date(depth2Event.endTime) &&
        new Date(event.endTime) >= new Date(depth2Event.startTime) &&
        new Date(event.endTime) <= new Date(depth2Event.endTime)
      ) {
        childEventIds.push(childEventId);
      }
    }
    await prismaClient.event.update({
      where: { id: depth2EventId },
      data: {
        childEvents: {
          connect: childEventIds.map((id) => {
            return { id: id };
          }),
        },
      },
    });
    depth2EventIds.push(depth2EventId);
    console.log(`Successfully seeded depth2 event with id: ${depth2EventId}`);
  }

  // Seeding depth3 events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const depth3Event = getEntityData<"event">(
      "event",
      "Depth3",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const depth3EventId = await seedEntity<"event">(
      "event",
      depth3Event,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      depth3EventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: eventManagerProfileId,
          eventId: depth3EventId,
          isPrivileged: true,
        },
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: depth3EventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: depth3EventId,
        },
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: depth3EventId,
          };
        }),
      ],
    });
    if (
      depth3Event.participationFrom !== undefined &&
      typeof depth3Event.participationFrom !== "string" &&
      depth3Event.participationFrom < new Date(Date.now())
    ) {
      const participantIds = someProfileIds[2].slice(
        0,
        depth3Event.participantLimit
          ? Math.round(
              depth3Event.participantLimit /
                faker.datatype.number({ min: 2, max: 10 })
            )
          : undefined
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: depth3EventId,
          },
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: depth3EventId,
            };
          }),
        ],
      });
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: eventCompanionOrganizationId,
          eventId: depth3EventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: depth3EventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: depth3EventId,
          };
        }),
      ],
    });
    const childEventIds = [];
    for (let childEventId of depth2EventIds) {
      const event = await prismaClient.event.findFirst({
        select: { startTime: true, endTime: true },
        where: { id: childEventId },
      });
      if (event === null) {
        continue;
      }
      if (
        new Date(event.startTime) >= new Date(depth3Event.startTime) &&
        new Date(event.startTime) <= new Date(depth3Event.endTime) &&
        new Date(event.endTime) >= new Date(depth3Event.startTime) &&
        new Date(event.endTime) <= new Date(depth3Event.endTime)
      ) {
        childEventIds.push(childEventId);
      }
    }
    await prismaClient.event.update({
      where: { id: depth3EventId },
      data: {
        childEvents: {
          connect: childEventIds.map((id) => {
            return { id: id };
          }),
        },
      },
    });
    console.log(`Successfully seeded depth3 event with id: ${depth3EventId}`);
  }

  // Seeding smallest document
  const smallestDocument = getEntityData<"document">(
    "document",
    "Smallest",
    0,
    {
      document:
        documentBucketData.documents[
          faker.datatype.number({
            min: 0,
            max: documentBucketData.documents.length - 1,
          })
        ],
    },
    useRealNames,
    numberOfStandardEntities
  );
  const smallestDocumentId = await seedEntity<"document">(
    "document",
    smallestDocument,
    authClient,
    defaultPassword
  );
  console.log(
    `Successfully seeded smallest document with id: ${smallestDocumentId}`
  );

  // Seeding smallest events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const smallestEvent = getEntityData<"event">(
      "event",
      "Smallest",
      i,
      {
        background: undefined,
      },
      useRealNames,
      numberOfStandardEntities
    );
    const smallestEventId = await seedEntity<"event">(
      "event",
      smallestEvent,
      authClient,
      defaultPassword
    );
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: smallestProfileId,
          eventId: smallestEventId,
          isPrivileged: true,
        },
      ],
    });
    await prismaClient.documentOfEvent.createMany({
      data: [
        {
          documentId: smallestDocumentId,
          eventId: smallestEventId,
        },
      ],
    });
    console.log(
      `Successfully seeded smallest event with id: ${smallestEventId}`
    );
  }

  // Seeding empty strings document
  const emptyStringsDocument = getEntityData<"document">(
    "document",
    "Empty Strings",
    0,
    {
      document:
        documentBucketData.documents[
          faker.datatype.number({
            min: 0,
            max: documentBucketData.documents.length - 1,
          })
        ],
    },
    useRealNames,
    numberOfStandardEntities
  );
  const emptyStringsDocumentId = await seedEntity<"document">(
    "document",
    emptyStringsDocument,
    authClient,
    defaultPassword
  );
  console.log(
    `Successfully seeded empty strings document with id: ${emptyStringsDocumentId}`
  );

  // Seeding empty strings events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const emptyStringsEvent = getEntityData<"event">(
      "event",
      "Empty Strings",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const emptyStringsEventId = await seedEntity<"event">(
      "event",
      emptyStringsEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      emptyStringsEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: emptyStringsProfileId,
          eventId: emptyStringsEventId,
          isPrivileged: true,
        },
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: emptyStringsEventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: emptyStringsEventId,
        },
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: emptyStringsEventId,
          };
        }),
      ],
    });
    if (
      emptyStringsEvent.participationFrom !== undefined &&
      typeof emptyStringsEvent.participationFrom !== "string" &&
      emptyStringsEvent.participationFrom < new Date(Date.now())
    ) {
      const participantIds = someProfileIds[2].slice(
        0,
        emptyStringsEvent.participantLimit
          ? Math.round(
              emptyStringsEvent.participantLimit /
                faker.datatype.number({ min: 2, max: 10 })
            )
          : undefined
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: emptyStringsEventId,
          },
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: emptyStringsEventId,
            };
          }),
        ],
      });
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: emptyStringsOrganizationId,
          eventId: emptyStringsEventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: emptyStringsEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        {
          documentId: emptyStringsDocumentId,
          eventId: emptyStringsEventId,
        },
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: emptyStringsEventId,
          };
        }),
      ],
    });
    console.log(
      `Successfully seeded empty strings event with id: ${emptyStringsEventId}`
    );
  }

  // Seeding fullParticipants event
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const fullParticipantsEvent = getEntityData<"event">(
      "event",
      "Full Participants",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const fullParticipantsEventId = await seedEntity<"event">(
      "event",
      fullParticipantsEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      fullParticipantsEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: eventManagerProfileId,
          eventId: fullParticipantsEventId,
        },
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: fullParticipantsEventId,
        },
      ],
    });
    if (
      fullParticipantsEvent.participantLimit !== null &&
      fullParticipantsEvent.participantLimit !== undefined
    ) {
      const participantIds = standardProfileIds.slice(
        0,
        fullParticipantsEvent.participantLimit - 1
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: fullParticipantsEventId,
          },
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: fullParticipantsEventId,
            };
          }),
        ],
      });
      const waitingParticipantIds = standardProfileIds.slice(
        fullParticipantsEvent.participantLimit - 1,
        fullParticipantsEvent.participantLimit +
          faker.datatype.number({ min: 0, max: 10 })
      );
      await prismaClient.waitingParticipantOfEvent.createMany({
        data: [
          ...waitingParticipantIds.map((id) => {
            return {
              profileId: id,
              eventId: fullParticipantsEventId,
            };
          }),
        ],
      });
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: fullParticipantsEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: fullParticipantsEventId,
          };
        }),
      ],
    });
    fullParticipantEventIds.push(fullParticipantsEventId);
    console.log(
      `Successfully seeded full participants event with id: ${fullParticipantsEventId}`
    );
  }

  // Seeding canceled events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const canceledEvent = getEntityData<"event">(
      "event",
      "Canceled",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const canceledEventId = await seedEntity<"event">(
      "event",
      canceledEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      canceledEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: eventManagerProfileId,
          eventId: canceledEventId,
          isPrivileged: true,
        },
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: canceledEventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: canceledEventId,
        },
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: canceledEventId,
          };
        }),
      ],
    });
    if (
      canceledEvent.participationFrom !== undefined &&
      typeof canceledEvent.participationFrom !== "string" &&
      canceledEvent.participationFrom < new Date(Date.now())
    ) {
      const participantIds = someProfileIds[2].slice(
        0,
        canceledEvent.participantLimit
          ? Math.round(
              canceledEvent.participantLimit /
                faker.datatype.number({ min: 2, max: 10 })
            )
          : undefined
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: canceledEventId,
          },
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: canceledEventId,
            };
          }),
        ],
      });
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: eventCompanionOrganizationId,
          eventId: canceledEventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: canceledEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: canceledEventId,
          };
        }),
      ],
    });
    console.log(
      `Successfully seeded canceled event with id: ${canceledEventId}`
    );
  }

  // Seeding unpublished events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const unpublishedEvent = getEntityData<"event">(
      "event",
      "Unpublished",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const unpublishedEventId = await seedEntity<"event">(
      "event",
      unpublishedEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      unpublishedEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: eventManagerProfileId,
          eventId: unpublishedEventId,
          isPrivileged: true,
        },
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: unpublishedEventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: unpublishedEventId,
        },
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: unpublishedEventId,
          };
        }),
      ],
    });
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: eventCompanionOrganizationId,
          eventId: unpublishedEventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: unpublishedEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: unpublishedEventId,
          };
        }),
      ],
    });
    console.log(
      `Successfully seeded unpublished event with id: ${unpublishedEventId}`
    );
  }

  // Seeding small team events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const smallTeamEvent = getEntityData<"event">(
      "event",
      "Small Team",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const smallTeamEventId = await seedEntity<"event">(
      "event",
      smallTeamEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      smallTeamEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getRandomUniqueSubset<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, faker.datatype.number({ min: 1, max: 3 }));
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: smallestProfileId,
          eventId: smallTeamEventId,
          isPrivileged: true,
        },
        ...someProfileIds.map((id) => {
          return {
            profileId: id,
            eventId: smallTeamEventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: smallTeamEventId,
        },
      ],
    });
    if (
      smallTeamEvent.participationFrom !== undefined &&
      typeof smallTeamEvent.participationFrom !== "string" &&
      smallTeamEvent.participationFrom < new Date(Date.now())
    ) {
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: smallTeamEventId,
          },
        ],
      });
    }
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: smallTeamOrganizationId,
          eventId: smallTeamEventId,
        },
      ],
    });
    await prismaClient.documentOfEvent.createMany({
      data: [
        {
          documentId: smallestDocumentId,
          eventId: smallTeamEventId,
        },
      ],
    });
    console.log(
      `Successfully seeded small team event with id: ${smallTeamEventId}`
    );
  }

  // Seeding large team events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const largeTeamEvent = getEntityData<"event">(
      "event",
      "Large Team",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const largeTeamEventId = await seedEntity<"event">(
      "event",
      largeTeamEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      largeTeamEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: largestProfileId,
          eventId: largeTeamEventId,
          isPrivileged: true,
        },
        ...standardProfileIds.map((id) => {
          return {
            profileId: id,
            eventId: largeTeamEventId,
          };
        }),
      ],
    });
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: largeTeamOrganizationId,
          eventId: largeTeamEventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: largeTeamEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        {
          documentId: largestDocumentId,
          eventId: largeTeamEventId,
        },
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: largeTeamEventId,
          };
        }),
      ],
    });
    console.log(
      `Successfully seeded large team event with id: ${largeTeamEventId}`
    );
  }

  // Seeding many responsible organizations events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const manyResponsibleOrganizationsEvent = getEntityData<"event">(
      "event",
      "Many Responsible Organizations",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const manyResponsibleOrganizationsEventId = await seedEntity<"event">(
      "event",
      manyResponsibleOrganizationsEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      manyResponsibleOrganizationsEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: eventManagerProfileId,
          eventId: manyResponsibleOrganizationsEventId,
          isPrivileged: true,
        },
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: manyResponsibleOrganizationsEventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: manyResponsibleOrganizationsEventId,
        },
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: manyResponsibleOrganizationsEventId,
          };
        }),
      ],
    });
    if (
      manyResponsibleOrganizationsEvent.participationFrom !== undefined &&
      typeof manyResponsibleOrganizationsEvent.participationFrom !== "string" &&
      manyResponsibleOrganizationsEvent.participationFrom < new Date(Date.now())
    ) {
      const participantIds = someProfileIds[2].slice(
        0,
        manyResponsibleOrganizationsEvent.participantLimit
          ? Math.round(
              manyResponsibleOrganizationsEvent.participantLimit /
                faker.datatype.number({ min: 2, max: 10 })
            )
          : undefined
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: manyResponsibleOrganizationsEventId,
          },
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: manyResponsibleOrganizationsEventId,
            };
          }),
        ],
      });
    }
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: eventCompanionOrganizationId,
          eventId: manyResponsibleOrganizationsEventId,
        },
        ...standardOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: manyResponsibleOrganizationsEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: manyResponsibleOrganizationsEventId,
          };
        }),
      ],
    });
    console.log(
      `Successfully seeded many responsible organizations event with id: ${manyResponsibleOrganizationsEventId}`
    );
  }

  // Seeding many speakers events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const manySpeakersEvent = getEntityData<"event">(
      "event",
      "Many Speakers",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const manySpeakersEventId = await seedEntity<"event">(
      "event",
      manySpeakersEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      manySpeakersEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: eventManagerProfileId,
          eventId: manySpeakersEventId,
          isPrivileged: true,
        },
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: manySpeakersEventId,
        },
        ...standardProfileIds.map((id) => {
          return {
            profileId: id,
            eventId: manySpeakersEventId,
          };
        }),
      ],
    });
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: eventCompanionOrganizationId,
          eventId: manySpeakersEventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: manySpeakersEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: manySpeakersEventId,
          };
        }),
      ],
    });
    console.log(
      `Successfully seeded many speakers event with id: ${manySpeakersEventId}`
    );
  }

  // Seeding many participants events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const manyParticipantsEvent = getEntityData<"event">(
      "event",
      "Many Participants",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const manyParticipantsEventId = await seedEntity<"event">(
      "event",
      manyParticipantsEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      manyParticipantsEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: eventManagerProfileId,
          eventId: manyParticipantsEventId,
          isPrivileged: true,
        },
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: manyParticipantsEventId,
        },
      ],
    });
    if (
      manyParticipantsEvent.participationFrom !== undefined &&
      typeof manyParticipantsEvent.participationFrom !== "string" &&
      manyParticipantsEvent.participationFrom < new Date(Date.now())
    ) {
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: manyParticipantsEventId,
          },
          ...standardProfileIds.map((id) => {
            return {
              profileId: id,
              eventId: manyParticipantsEventId,
            };
          }),
        ],
      });
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: eventCompanionOrganizationId,
          eventId: manyParticipantsEventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: manyParticipantsEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: manyParticipantsEventId,
          };
        }),
      ],
    });
    console.log(
      `Successfully seeded many participants event with id: ${manyParticipantsEventId}`
    );
  }

  // Seeding many documents events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const manyDocumentsEvent = getEntityData<"event">(
      "event",
      "Many Documents",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const manyDocumentsEventId = await seedEntity<"event">(
      "event",
      manyDocumentsEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      manyDocumentsEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: eventManagerProfileId,
          eventId: manyDocumentsEventId,
          isPrivileged: true,
        },
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: manyDocumentsEventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: manyDocumentsEventId,
        },
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: manyDocumentsEventId,
          };
        }),
      ],
    });
    if (
      manyDocumentsEvent.participationFrom !== undefined &&
      typeof manyDocumentsEvent.participationFrom !== "string" &&
      manyDocumentsEvent.participationFrom < new Date(Date.now())
    ) {
      const participantIds = someProfileIds[2].slice(
        0,
        manyDocumentsEvent.participantLimit
          ? Math.round(
              manyDocumentsEvent.participantLimit /
                faker.datatype.number({ min: 2, max: 10 })
            )
          : undefined
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: manyDocumentsEventId,
          },
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: manyDocumentsEventId,
            };
          }),
        ],
      });
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: eventCompanionOrganizationId,
          eventId: manyDocumentsEventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: manyDocumentsEventId,
          };
        }),
      ],
    });
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...standardDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: manyDocumentsEventId,
          };
        }),
      ],
    });
    console.log(
      `Successfully seeded many documents event with id: ${manyDocumentsEventId}`
    );
  }

  // Seeding overfull participants events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const overfullParticipantsEvent = getEntityData<"event">(
      "event",
      "Overfull Participants",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const overfullParticipantsEventId = await seedEntity<"event">(
      "event",
      overfullParticipantsEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      overfullParticipantsEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: eventManagerProfileId,
          eventId: overfullParticipantsEventId,
          isPrivileged: true,
        },
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: overfullParticipantsEventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: overfullParticipantsEventId,
        },
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: overfullParticipantsEventId,
          };
        }),
      ],
    });
    await prismaClient.participantOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: overfullParticipantsEventId,
        },
        ...standardProfileIds.map((id) => {
          return {
            profileId: id,
            eventId: overfullParticipantsEventId,
          };
        }),
      ],
    });
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: eventCompanionOrganizationId,
          eventId: overfullParticipantsEventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: overfullParticipantsEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: overfullParticipantsEventId,
          };
        }),
      ],
    });
    console.log(
      `Successfully seeded overfull participants event with id: ${overfullParticipantsEventId}`
    );
  }

  // Seeding unicode document
  const unicodeDocument = getEntityData<"document">(
    "document",
    "Unicode",
    0,
    {
      document:
        documentBucketData.documents[
          faker.datatype.number({
            min: 0,
            max: documentBucketData.documents.length - 1,
          })
        ],
    },
    useRealNames,
    numberOfStandardEntities
  );
  const unicodeDocumentId = await seedEntity<"document">(
    "document",
    unicodeDocument,
    authClient,
    defaultPassword
  );
  console.log(
    `Successfully seeded unicode document with id: ${unicodeDocumentId}`
  );

  // Seeding unicode events
  for (let i = 0; i < numberOfEventsPerStructure; i++) {
    const unicodeEvent = getEntityData<"event">(
      "event",
      "Unicode",
      i,
      {
        background: {
          path: imageBucketData.backgrounds[
            faker.datatype.number({
              min: 0,
              max: imageBucketData.backgrounds.length - 1,
            })
          ],
        },
      },
      useRealNames,
      numberOfStandardEntities
    );
    const unicodeEventId = await seedEntity<"event">(
      "event",
      unicodeEvent,
      authClient,
      defaultPassword
    );
    await addBasicEventRelations(
      unicodeEventId,
      areas,
      focuses,
      eventTypes,
      experienceLevels,
      stages,
      tags,
      targetGroups
    );
    someProfileIds = getMultipleRandomUniqueSubsets<
      ArrayElement<typeof standardProfileIds>
    >(standardProfileIds, 3);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: unicodeProfileId,
          eventId: unicodeEventId,
          isPrivileged: true,
        },
        ...someProfileIds[0].map((id) => {
          return {
            profileId: id,
            eventId: unicodeEventId,
          };
        }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
        {
          profileId: coordinatorProfileId,
          eventId: unicodeEventId,
        },
        ...someProfileIds[1].map((id) => {
          return {
            profileId: id,
            eventId: unicodeEventId,
          };
        }),
      ],
    });
    if (
      unicodeEvent.participationFrom !== undefined &&
      typeof unicodeEvent.participationFrom !== "string" &&
      unicodeEvent.participationFrom < new Date(Date.now())
    ) {
      const participantIds = someProfileIds[2].slice(
        0,
        unicodeEvent.participantLimit
          ? Math.round(
              unicodeEvent.participantLimit /
                faker.datatype.number({ min: 2, max: 10 })
            )
          : undefined
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          {
            profileId: coordinatorProfileId,
            eventId: unicodeEventId,
          },
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: unicodeEventId,
            };
          }),
        ],
      });
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof standardOrganizationIds>
    >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.responsibleOrganizationOfEvent.createMany({
      data: [
        {
          organizationId: unicodeOrganizationId,
          eventId: unicodeEventId,
        },
        ...someOrganizationIds.map((id) => {
          return {
            organizationId: id,
            eventId: unicodeEventId,
          };
        }),
      ],
    });
    someDocumentIds = getRandomUniqueSubset<
      ArrayElement<typeof standardDocumentIds>
    >(standardDocumentIds, faker.datatype.number({ min: 1, max: 10 }));
    await prismaClient.documentOfEvent.createMany({
      data: [
        {
          documentId: unicodeDocumentId,
          eventId: unicodeEventId,
        },
        ...someDocumentIds.map((id) => {
          return {
            documentId: id,
            eventId: unicodeEventId,
          };
        }),
      ],
    });
    console.log(`Successfully seeded unicode event with id: ${unicodeEventId}`);
  }

  // Seeding developer project
  const developerProject = getEntityData<"project">(
    "project",
    "Developer",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const developerProjectId = await seedEntity<"project">(
    "project",
    developerProject,
    authClient,
    defaultPassword
  );
  await addBasicProjectRelations(developerProjectId, disciplines, targetGroups);
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      {
        profileId: developerProfileId,
        projectId: developerProjectId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          projectId: developerProjectId,
        };
      }),
    ],
  });
  someOrganizationIds = getRandomUniqueSubset<
    ArrayElement<typeof standardOrganizationIds>
  >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      {
        organizationId: developerOrganizationId,
        projectId: developerProjectId,
      },
      ...someOrganizationIds.map((id) => {
        return {
          organizationId: id,
          projectId: developerProjectId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded developer project with id: ${developerProjectId}`
  );

  // Seeding smallest award
  const smallestAward = getEntityData<"award">(
    "award",
    "Smallest",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const smallestAwardId = await seedEntity<"award">(
    "award",
    smallestAward,
    authClient,
    defaultPassword
  );
  console.log(`Successfully seeded smallest award with id: ${smallestAwardId}`);

  // Seeding smallest project
  const smallestproject = getEntityData<"project">(
    "project",
    "Smallest",
    0,
    {
      logo: undefined,
      background: undefined,
    },
    useRealNames,
    numberOfStandardEntities
  );
  const smallestProjectId = await seedEntity<"project">(
    "project",
    smallestproject,
    authClient,
    defaultPassword
  );
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      {
        profileId: smallestProfileId,
        projectId: smallestProjectId,
        isPrivileged: true,
      },
    ],
  });
  someOrganizationIds = getRandomUniqueSubset<
    ArrayElement<typeof standardOrganizationIds>
  >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      {
        organizationId: smallestOrganizationId,
        projectId: smallestProjectId,
      },
    ],
  });
  await prismaClient.awardOfProject.createMany({
    data: [
      {
        awardId: smallestAwardId,
        projectId: smallestProjectId,
      },
    ],
  });
  console.log(
    `Successfully seeded smallest project with id: ${smallestProjectId}`
  );

  // Seeding empty strings award
  const emptyStringsAward = getEntityData<"award">(
    "award",
    "Empty Strings",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const emptyStringsAwardId = await seedEntity<"award">(
    "award",
    emptyStringsAward,
    authClient,
    defaultPassword
  );
  console.log(
    `Successfully seeded empty strings award with id: ${emptyStringsAwardId}`
  );

  // Seeding empty strings project
  const emptyStringsProject = getEntityData<"project">(
    "project",
    "Empty Strings",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const emptyStringsProjectId = await seedEntity<"project">(
    "project",
    emptyStringsProject,
    authClient,
    defaultPassword
  );
  await addBasicProjectRelations(
    emptyStringsProjectId,
    disciplines,
    targetGroups
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      {
        profileId: emptyStringsProfileId,
        projectId: emptyStringsProjectId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          projectId: emptyStringsProjectId,
        };
      }),
    ],
  });
  someOrganizationIds = getRandomUniqueSubset<
    ArrayElement<typeof standardOrganizationIds>
  >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      {
        organizationId: emptyStringsOrganizationId,
        projectId: emptyStringsProjectId,
      },
      ...someOrganizationIds.map((id) => {
        return {
          organizationId: id,
          projectId: emptyStringsProjectId,
        };
      }),
    ],
  });
  await prismaClient.awardOfProject.createMany({
    data: [
      {
        awardId: emptyStringsAwardId,
        projectId: smallestProjectId,
      },
    ],
  });
  console.log(
    `Successfully seeded empty strings project with id: ${emptyStringsProjectId}`
  );

  // Seeding multiple awarded project
  const multipleAwardedProject = getEntityData<"project">(
    "project",
    "Multiple Awarded",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const multipleAwardedProjectId = await seedEntity<"project">(
    "project",
    multipleAwardedProject,
    authClient,
    defaultPassword
  );
  await addBasicProjectRelations(
    multipleAwardedProjectId,
    disciplines,
    targetGroups
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      {
        profileId: makerProfileId,
        projectId: multipleAwardedProjectId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          projectId: multipleAwardedProjectId,
        };
      }),
    ],
  });
  someOrganizationIds = getRandomUniqueSubset<
    ArrayElement<typeof standardOrganizationIds>
  >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      {
        organizationId: projectCompanionOrganizationId,
        projectId: multipleAwardedProjectId,
      },
      ...someOrganizationIds.map((id) => {
        return {
          organizationId: id,
          projectId: multipleAwardedProjectId,
        };
      }),
    ],
  });
  await prismaClient.awardOfProject.createMany({
    data: [
      ...standardAwardIds.map((id) => {
        return {
          awardId: id,
          projectId: multipleAwardedProjectId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded empty strings project with id: ${multipleAwardedProjectId}`
  );

  // Seeding small team project
  const smallTeamProject = getEntityData<"project">(
    "project",
    "Small Team",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const smallTeamProjectId = await seedEntity<"project">(
    "project",
    smallTeamProject,
    authClient,
    defaultPassword
  );
  await addBasicProjectRelations(smallTeamProjectId, disciplines, targetGroups);
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 3 }));
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      {
        profileId: smallestProfileId,
        projectId: smallTeamProjectId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          projectId: smallTeamProjectId,
        };
      }),
    ],
  });
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      {
        organizationId: smallestOrganizationId,
        projectId: smallTeamProjectId,
      },
    ],
  });
  console.log(
    `Successfully seeded small team project with id: ${smallTeamProjectId}`
  );

  // Seeding large team project
  const largeTeamProject = getEntityData<"project">(
    "project",
    "Large Team",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const largeTeamProjectId = await seedEntity<"project">(
    "project",
    largeTeamProject,
    authClient,
    defaultPassword
  );
  await addBasicProjectRelations(largeTeamProjectId, disciplines, targetGroups);
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      {
        profileId: largestProfileId,
        projectId: largeTeamProjectId,
        isPrivileged: true,
      },
      ...standardProfileIds.map((id) => {
        return {
          profileId: id,
          projectId: largeTeamProjectId,
        };
      }),
    ],
  });
  someOrganizationIds = getRandomUniqueSubset<
    ArrayElement<typeof standardOrganizationIds>
  >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      {
        organizationId: largeTeamOrganizationId,
        projectId: largeTeamProjectId,
      },
      ...someOrganizationIds.map((id) => {
        return {
          organizationId: id,
          projectId: largeTeamProjectId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded large team project with id: ${largeTeamProjectId}`
  );

  // Seeding many responsible organizations project
  const manyResponsibleOrganizationsProject = getEntityData<"project">(
    "project",
    "Many Responsible Organizations",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const manyResponsibleOrganizationsProjectId = await seedEntity<"project">(
    "project",
    manyResponsibleOrganizationsProject,
    authClient,
    defaultPassword
  );
  await addBasicProjectRelations(
    manyResponsibleOrganizationsProjectId,
    disciplines,
    targetGroups
  );
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      {
        profileId: makerProfileId,
        projectId: manyResponsibleOrganizationsProjectId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          projectId: manyResponsibleOrganizationsProjectId,
        };
      }),
    ],
  });
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      {
        organizationId: projectCompanionOrganizationId,
        projectId: manyResponsibleOrganizationsProjectId,
      },
      ...standardOrganizationIds.map((id) => {
        return {
          organizationId: id,
          projectId: manyResponsibleOrganizationsProjectId,
        };
      }),
    ],
  });
  console.log(
    `Successfully seeded many responsible organizations project with id: ${manyResponsibleOrganizationsProjectId}`
  );

  // Seeding unicode award
  const unicodeAward = getEntityData<"award">(
    "award",
    "Unicode",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const unicodeAwardId = await seedEntity<"award">(
    "award",
    unicodeAward,
    authClient,
    defaultPassword
  );
  console.log(`Successfully seeded unicode award with id: ${unicodeAwardId}`);

  // Seeding unicode project
  const unicodeProject = getEntityData<"project">(
    "project",
    "Unicode",
    0,
    {
      logo: {
        path: imageBucketData.logos[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.logos.length - 1,
          })
        ],
      },
      background: {
        path: imageBucketData.backgrounds[
          faker.datatype.number({
            min: 0,
            max: imageBucketData.backgrounds.length - 1,
          })
        ],
      },
    },
    useRealNames,
    numberOfStandardEntities
  );
  const unicodeProjectId = await seedEntity<"project">(
    "project",
    unicodeProject,
    authClient,
    defaultPassword
  );
  await addBasicProjectRelations(unicodeProjectId, disciplines, targetGroups);
  someProfileIds = getRandomUniqueSubset<
    ArrayElement<typeof standardProfileIds>
  >(standardProfileIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.teamMemberOfProject.createMany({
    data: [
      {
        profileId: unicodeProfileId,
        projectId: unicodeProjectId,
        isPrivileged: true,
      },
      ...someProfileIds.map((id) => {
        return {
          profileId: id,
          projectId: unicodeProjectId,
        };
      }),
    ],
  });
  someOrganizationIds = getRandomUniqueSubset<
    ArrayElement<typeof standardOrganizationIds>
  >(standardOrganizationIds, faker.datatype.number({ min: 1, max: 10 }));
  await prismaClient.responsibleOrganizationOfProject.createMany({
    data: [
      {
        organizationId: unicodeOrganizationId,
        projectId: unicodeProjectId,
      },
      ...someOrganizationIds.map((id) => {
        return {
          organizationId: id,
          projectId: unicodeProjectId,
        };
      }),
    ],
  });
  await prismaClient.awardOfProject.createMany({
    data: [
      {
        awardId: unicodeAwardId,
        projectId: unicodeProjectId,
      },
    ],
  });
  console.log(
    `Successfully seeded unicode project with id: ${unicodeProjectId}`
  );

  return profileEmails;
}

// TODO: Add static data like focuses, eventTypes, targetGroups, etc...
export function getEntityData<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  index: number,
  bucketData: EntityTypeOnBucketData<T>,
  useRealNames: boolean,
  numberOfStandardEntities: number
) {
  const entityData: unknown = {
    username: generateUsername<T>(entityType, entityStructure, index),
    title: generateTitle<T>(entityType, entityStructure),
    date: generateDate<T>(entityType, index),
    shortTitle: generateShortTitle<T>(entityType, entityStructure),
    path: setPath<T>(entityType, bucketData),
    mimeType: setMimeType<T>(entityType, bucketData),
    filename: setFilename<T>(entityType, bucketData),
    extension: setExtension<T>(entityType, bucketData),
    sizeInMB: setSizeInMB<T>(entityType, bucketData),
    name: generateName<T>(entityType, entityStructure, useRealNames),
    slug: generateSlug<T>(entityType, entityStructure, index),
    headline: generateHeadline<T>(entityType, entityStructure, useRealNames),
    excerpt: generateExcerpt<T>(entityType, entityStructure),
    startTime: generateStartTime<T>(entityType, entityStructure, index),
    endTime: generateEndTime<T>(entityType, entityStructure, index),
    description: generateDescription<T>(entityType, entityStructure),
    subline: generateSubline<T>(entityType, entityStructure),
    published: generatePublished<T>(entityType, entityStructure),
    conferenceLink: generateConferenceLink<T>(entityType, entityStructure),
    conferenceCode: generateConferenceCode<T>(entityType, entityStructure),
    participantLimit: generateParticipantLimit<T>(
      entityType,
      entityStructure,
      index,
      numberOfStandardEntities
    ),
    participationFrom: generateParticipationFrom<T>(entityType, index),
    participationUntil: generateParticipationUntil<T>(entityType, index),
    venueName: generateVenueName<T>(entityType, entityStructure),
    venueStreet: generateVenueStreet<T>(entityType, entityStructure),
    venueStreetNumber: generateVenueStreetNumber<T>(
      entityType,
      entityStructure
    ),
    venueCity: generateVenueCity<T>(entityType, entityStructure),
    venueZipCode: generateVenueZipCode<T>(entityType, entityStructure),
    canceled: generateCanceled<T>(entityType, entityStructure),
    email: generateEmail<T>(entityType, entityStructure, index),
    phone: generatePhone<T>(entityType, entityStructure),
    street: generateStreet<T>(entityType, entityStructure),
    streetNumber: generateStreetNumber<T>(entityType, entityStructure),
    city: generateCity<T>(entityType, entityStructure),
    zipCode: generateZipCode<T>(entityType, entityStructure),
    website: generateWebsite<T>(entityType, entityStructure),
    logo: setLogo(entityType, entityStructure, bucketData),
    avatar: setAvatar(entityType, entityStructure, bucketData),
    background: setBackground(entityType, entityStructure, bucketData),
    facebook: generateSocialMediaUrl<T>(
      entityType,
      entityStructure,
      "facebook"
    ),
    linkedin: generateSocialMediaUrl<T>(
      entityType,
      entityStructure,
      "linkedin"
    ),
    twitter: generateSocialMediaUrl<T>(entityType, entityStructure, "twitter"),
    xing: generateSocialMediaUrl<T>(entityType, entityStructure, "xing"),
    instagram: generateSocialMediaUrl<T>(
      entityType,
      entityStructure,
      "instagram"
    ),
    youtube: generateSocialMediaUrl<T>(entityType, entityStructure, "youtube"),
    bio: generateBio<T>(entityType, entityStructure),
    quote: generateQuote<T>(entityType, entityStructure),
    quoteAuthor: generateQuoteAuthor<T>(entityType, entityStructure),
    quoteAuthorInformation: generateQuoteAuthorInformation<T>(
      entityType,
      entityStructure
    ),
    supportedBy: generateSupportedBy<T>(entityType, entityStructure),
    skills: generateSkills<T>(entityType, entityStructure),
    interests: generateInterests<T>(entityType, entityStructure),
    academicTitle: generateAcademicTitle<T>(entityType, entityStructure),
    firstName: generateFirstName<T>(entityType, entityStructure, useRealNames),
    lastName: generateLastName<T>(entityType, entityStructure, useRealNames),
    publicFields: generatePublicFields<T>(entityType, entityStructure),
    termsAccepted: generateTermsAccepted<T>(entityType),
    position: generatePosition<T>(entityType, entityStructure),
  };
  return entityData as EntityTypeOnData<T>;
}

// TODO: Do we need this function?
export async function seedEntity<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entity: EntityTypeOnData<T>,
  authClient: SupabaseClient<any, "public", any>,
  defaultPassword: string
) {
  let result;
  if (
    entityType === "profile" &&
    "firstName" in entity &&
    entity.email !== undefined
  ) {
    const { data, error } = await authClient.auth.admin.createUser({
      email: entity.email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        firstName: entity.firstName,
        lastName: entity.lastName,
        username: entity.username,
        academicTitle: entity.academicTitle || null,
        termsAccepted: entity.termsAccepted,
      },
    });
    if (error !== null || data === null) {
      console.error(
        `The user with the email '${entity.email}' and the corresponding profile could not be created due to following error. ${error}`
      );
    } else {
      try {
        result = await prismaClient.profile.update({
          where: { id: data.user.id },
          data: entity,
          select: { id: true },
        });
      } catch (e) {
        console.error(e);
        throw new Error(
          "User was created on auth.users table but not on public.profiles table. Are you sure the database trigger to create a profile on user creation is enabled? If not try to run the supabase.enhancements.sql in Supabase Studio."
        );
      }
    }
  } else {
    // TODO: fix union type issue (almost got the generic working, but thats too hard...)
    // What i wanted was: When i pass "profile" as type T then the passed entity must be of type Prisma.ProfileCreateArgs["data"]
    // @ts-ignore
    result = await prismaClient[entityType].create({
      data: entity,
      select: { id: true },
    });
  }
  return result.id as string;
}

async function addBasicProfileRelations(
  profileId: string,
  areas: { id: string }[],
  offersAndSeekings: { id: string }[],
  addMaximum = false
) {
  const someAreas = addMaximum
    ? areas
    : getRandomUniqueSubset<ArrayElement<typeof areas>>(
        areas,
        faker.datatype.number({ min: 1, max: 10 })
      );
  const someOffers = addMaximum
    ? offersAndSeekings
    : getRandomUniqueSubset<ArrayElement<typeof offersAndSeekings>>(
        offersAndSeekings
      );
  const someSeekings = addMaximum
    ? offersAndSeekings
    : getRandomUniqueSubset<ArrayElement<typeof offersAndSeekings>>(
        offersAndSeekings
      );
  await prismaClient.profile.update({
    where: {
      id: profileId,
    },
    data: {
      areas: {
        connectOrCreate: someAreas.map((area) => ({
          where: {
            profileId_areaId: {
              areaId: area.id,
              profileId: profileId,
            },
          },
          create: {
            areaId: area.id,
          },
        })),
      },
      offers: {
        connectOrCreate: someOffers.map((offer) => ({
          where: {
            profileId_offerId: {
              offerId: offer.id,
              profileId: profileId,
            },
          },
          create: {
            offerId: offer.id,
          },
        })),
      },
      seekings: {
        connectOrCreate: someSeekings.map((seeking) => ({
          where: {
            profileId_offerId: {
              offerId: seeking.id,
              profileId: profileId,
            },
          },
          create: {
            offerId: seeking.id,
          },
        })),
      },
    },
  });
}

async function addBasicOrganizationRelations(
  organizationId: string,
  areas: { id: string }[],
  focuses: { id: string }[],
  organizationTypes: { id: string }[],
  addMaximum = false
) {
  const someAreas = addMaximum
    ? areas
    : getRandomUniqueSubset<ArrayElement<typeof areas>>(
        areas,
        faker.datatype.number({ min: 1, max: 10 })
      );
  const someFocuses = addMaximum
    ? focuses
    : getRandomUniqueSubset<ArrayElement<typeof focuses>>(focuses);
  const someOrganizationTypes = addMaximum
    ? organizationTypes
    : getRandomUniqueSubset<ArrayElement<typeof organizationTypes>>(
        organizationTypes
      );
  await prismaClient.organization.update({
    where: {
      id: organizationId,
    },
    data: {
      areas: {
        connectOrCreate: someAreas.map((area) => ({
          where: {
            organizationId_areaId: {
              areaId: area.id,
              organizationId: organizationId,
            },
          },
          create: {
            areaId: area.id,
          },
        })),
      },
      focuses: {
        connectOrCreate: someFocuses.map((focus) => ({
          where: {
            organizationId_focusId: {
              focusId: focus.id,
              organizationId: organizationId,
            },
          },
          create: {
            focusId: focus.id,
          },
        })),
      },
      types: {
        connectOrCreate: someOrganizationTypes.map((type) => ({
          where: {
            organizationId_organizationTypeId: {
              organizationTypeId: type.id,
              organizationId: organizationId,
            },
          },
          create: {
            organizationTypeId: type.id,
          },
        })),
      },
    },
  });
}

async function addBasicEventRelations(
  eventId: string,
  areas: { id: string }[],
  focuses: { id: string }[],
  eventTypes: { id: string }[],
  experienceLevels: { id: string }[],
  stages: { id: string }[],
  tags: { id: string }[],
  targetGroups: { id: string }[],
  addMaximum = false
) {
  const someAreas = addMaximum
    ? areas
    : getRandomUniqueSubset<ArrayElement<typeof areas>>(
        areas,
        faker.datatype.number({ min: 1, max: 10 })
      );
  const someFocuses = addMaximum
    ? focuses
    : getRandomUniqueSubset<ArrayElement<typeof focuses>>(focuses);
  const someEventTypes = addMaximum
    ? eventTypes
    : getRandomUniqueSubset<ArrayElement<typeof eventTypes>>(eventTypes);
  const someExperienceLevel = getRandomUniqueSubset<
    ArrayElement<typeof experienceLevels>
  >(experienceLevels, 1);
  const someStage = getRandomUniqueSubset<ArrayElement<typeof stages>>(
    stages,
    1
  );
  const someTags = addMaximum
    ? tags
    : getRandomUniqueSubset<ArrayElement<typeof tags>>(tags);
  const someTargetGroups = addMaximum
    ? targetGroups
    : getRandomUniqueSubset<ArrayElement<typeof targetGroups>>(targetGroups);
  await prismaClient.event.update({
    where: {
      id: eventId,
    },
    data: {
      areas: {
        connectOrCreate: someAreas.map((area) => ({
          where: {
            eventId_areaId: {
              areaId: area.id,
              eventId: eventId,
            },
          },
          create: {
            areaId: area.id,
          },
        })),
      },
      focuses: {
        connectOrCreate: someFocuses.map((focus) => ({
          where: {
            eventId_focusId: {
              focusId: focus.id,
              eventId: eventId,
            },
          },
          create: {
            focusId: focus.id,
          },
        })),
      },
      types: {
        connectOrCreate: someEventTypes.map((type) => ({
          where: {
            eventTypeId_eventId: {
              eventTypeId: type.id,
              eventId: eventId,
            },
          },
          create: {
            eventTypeId: type.id,
          },
        })),
      },
      experienceLevelId: someExperienceLevel[0]?.id || undefined,
      stageId: someStage[0]?.id || undefined,
      tags: {
        connectOrCreate: someTags.map((tag) => ({
          where: {
            tagId_eventId: {
              tagId: tag.id,
              eventId: eventId,
            },
          },
          create: {
            tagId: tag.id,
          },
        })),
      },
      targetGroups: {
        connectOrCreate: someTargetGroups.map((targetGroup) => ({
          where: {
            targetGroupId_eventId: {
              targetGroupId: targetGroup.id,
              eventId: eventId,
            },
          },
          create: {
            targetGroupId: targetGroup.id,
          },
        })),
      },
    },
  });
}

async function addBasicProjectRelations(
  projectId: string,
  disciplines: { id: string }[],
  targetGroups: { id: string }[],
  addMaximum = false
) {
  const someDisciplines = addMaximum
    ? disciplines
    : getRandomUniqueSubset<ArrayElement<typeof disciplines>>(disciplines);
  const someTargetGroups = addMaximum
    ? targetGroups
    : getRandomUniqueSubset<ArrayElement<typeof targetGroups>>(targetGroups);
  await prismaClient.project.update({
    where: {
      id: projectId,
    },
    data: {
      disciplines: {
        connectOrCreate: someDisciplines.map((discipline) => ({
          where: {
            disciplineId_projectId: {
              disciplineId: discipline.id,
              projectId: projectId,
            },
          },
          create: {
            disciplineId: discipline.id,
          },
        })),
      },
      targetGroups: {
        connectOrCreate: someTargetGroups.map((targetGroup) => ({
          where: {
            targetGroupId_projectId: {
              targetGroupId: targetGroup.id,
              projectId: projectId,
            },
          },
          create: {
            targetGroupId: targetGroup.id,
          },
        })),
      },
    },
  });
}

function generateUsername<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>, index: number) {
  // profile required unique
  let username;
  if (entityType === "profile") {
    if (entityStructure === "Developer") {
      username = generateUsername_app("0_Developer", `Profile${index}`);
    } else if (entityStructure === "Unicode") {
      username = generateUsername_app(
        `${entityStructure}_Γ`,
        `Profile_Γ${index}`
      );
    } else if (entityStructure === "Standard") {
      username = generateUsername_app("Y_Standard", `Profile${index}`);
    } else {
      username = generateUsername_app(entityStructure, `Profile${index}`);
    }
  }
  return username;
}

function generateTitle<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // award required, document
  let title;
  if (entityType === "award") {
    if (entityStructure === "Standard") {
      title = "Best Practice Project";
    }
    if (entityStructure === "Unicode") {
      title = "Best Practice Project_Γ";
    }
    if (entityStructure === "Smallest") {
      title = "A-Level";
    }
    if (entityStructure === "Largest") {
      title = "Best Practice Project In The Education Sector";
    }
    if (entityStructure === "Empty Strings") {
      title = "";
    }
  }
  if (entityType === "document") {
    if (entityStructure === "Standard") {
      title = "Standard document title";
    }
    if (entityStructure === "Unicode") {
      title = "Standard document title_Γ";
    }
    if (entityStructure === "Smallest") {
      title = null;
    }
    if (entityStructure === "Largest") {
      title = "A very large document title";
    }
    if (entityStructure === "Empty Strings") {
      title = "";
    }
  }
  return title;
}

function generateDate<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, index: number) {
  // award (default now)
  let date;
  if (entityType === "award") {
    date = new Date(2020 + index, 6);
  }
  return date;
}

function generateShortTitle<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // award
  let shortTitle;
  if (entityType === "award") {
    if (entityStructure === "Standard") {
      shortTitle = "Best Practice";
    }
    if (entityStructure === "Unicode") {
      shortTitle = "Best Practice_Γ";
    }
    if (entityStructure === "Smallest") {
      shortTitle = "A";
    }
    if (entityStructure === "Largest") {
      shortTitle = "Best Practice Education";
    }
    if (entityStructure === "Empty Strings") {
      shortTitle = "";
    }
  }
  return shortTitle;
}

function setPath<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, bucketData: EntityTypeOnBucketData<T>) {
  // document required
  let path;
  if ("document" in bucketData && bucketData.document !== undefined) {
    if (entityType === "document") {
      path = bucketData.document.path;
    }
  }
  return path;
}

function setMimeType<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, bucketData: EntityTypeOnBucketData<T>) {
  // document required
  let mimeType;
  if ("document" in bucketData && bucketData.document !== undefined) {
    if (entityType === "document") {
      mimeType = bucketData.document.mimeType;
    }
  }
  return mimeType;
}

function setExtension<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, bucketData: EntityTypeOnBucketData<T>) {
  // document required
  let extension;
  if ("document" in bucketData && bucketData.document !== undefined) {
    if (entityType === "document") {
      extension = bucketData.document.extension;
    }
  }
  return extension;
}

function setFilename<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, bucketData: EntityTypeOnBucketData<T>) {
  // document required
  let filename;
  if ("document" in bucketData && bucketData.document !== undefined) {
    if (entityType === "document") {
      filename = bucketData.document.filename;
    }
  }
  return filename;
}

function setSizeInMB<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, bucketData: EntityTypeOnBucketData<T>) {
  // document required
  let sizeInMB;
  if ("document" in bucketData && bucketData.document !== undefined) {
    if (entityType === "document") {
      sizeInMB = bucketData.document.sizeInMB;
    }
  }
  return sizeInMB;
}

function generateName<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  useRealNames: boolean
) {
  // organization required, event required, project required
  let name;
  if (
    entityType === "organization" ||
    entityType === "event" ||
    entityType === "project"
  ) {
    if (useRealNames) {
      if (entityType === "event") {
        name = faker.music.genre();
      } else if (entityType === "project") {
        name = faker.commerce.productName();
      } else {
        name = faker.company.name();
      }
    } else {
      if (entityStructure === "Developer") {
        name = `0_${entityStructure} ${entityType.replace(
          /^./,
          function (match) {
            return match.toUpperCase();
          }
        )}`;
      } else if (entityStructure === "Standard") {
        name = `Y_${entityStructure} ${entityType.replace(
          /^./,
          function (match) {
            return match.toUpperCase();
          }
        )}`;
      } else if (entityStructure === "Unicode") {
        name = `${entityStructure} ${entityType.replace(/^./, function (match) {
          return match.toUpperCase();
        })}_Γ`;
      } else {
        name = `${entityStructure} ${entityType.replace(/^./, function (match) {
          return match.toUpperCase();
        })}`;
      }
    }
  }
  return name;
}

function generateSlug<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>, index: number) {
  // organization required unique, event required unique, project required unique, award required unique
  let slug;
  if (entityType === "organization") {
    if (entityStructure === "Developer") {
      slug = generateOrganizationSlug(`0_${entityStructure} Organization`);
    } else if (entityStructure === "Standard") {
      slug = generateOrganizationSlug(`Y_${entityStructure} Organization`);
    } else if (entityStructure === "Unicode") {
      slug = generateOrganizationSlug(`${entityStructure} Organization_Γ`);
    } else {
      slug = generateOrganizationSlug(`${entityStructure} Organization`);
    }
  }
  if (entityType === "event") {
    if (entityStructure === "Developer") {
      slug = generateEventSlug(`0_${entityStructure} Event`);
    } else if (entityStructure === "Standard") {
      slug = generateEventSlug(`Y_${entityStructure} Event`);
    } else if (entityStructure === "Unicode") {
      slug = generateEventSlug(`${entityStructure} Event_Γ`);
    } else {
      slug = generateEventSlug(`${entityStructure} Event`);
    }
  }
  if (entityType === "project") {
    if (entityStructure === "Developer") {
      slug = generateProjectSlug(`0_${entityStructure} Project`);
    } else if (entityStructure === "Standard") {
      slug = generateProjectSlug(`Y_${entityStructure} Project`);
    } else if (entityStructure === "Unicode") {
      slug = generateProjectSlug(`${entityStructure} Project_Γ`);
    } else {
      slug = generateProjectSlug(`${entityStructure} Project`);
    }
  }
  if (entityType === "award") {
    slug = generateProjectSlug(`${entityStructure} Award${index}`);
  }
  return slug;
}

function generateHeadline<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  useRealNames: boolean
) {
  // project
  let headline;
  if (entityType === "project") {
    if (entityStructure === "Smallest") {
      headline = null;
    } else if (entityStructure === "Empty Strings") {
      headline = "";
    } else if (entityStructure === "Unicode") {
      headline = "Project_Γ";
    } else if (entityStructure === "Largest") {
      headline =
        "Very long project headline - This project headline was created by cn and not by faker - And it gets even longer - Ohhhhhhhhh it is very long, indeed";
    } else {
      if (useRealNames) {
        headline = faker.commerce.productName();
      } else {
        headline = `${entityStructure} ${entityType.replace(
          /^./,
          function (match) {
            return match.toUpperCase();
          }
        )}`;
      }
    }
  }
  return headline;
}

function generateExcerpt<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // project
  let excerpt;
  if (entityType === "project") {
    if (entityStructure === "Smallest") {
      excerpt = null;
    } else if (entityStructure === "Empty Strings") {
      excerpt = "";
    } else if (entityStructure === "Unicode") {
      excerpt = "Project excerpt with unicode character_Γ";
    } else if (entityStructure === "Largest") {
      excerpt = faker.lorem.paragraphs(50);
    } else {
      excerpt = faker.lorem.paragraphs(5);
    }
  }
  return excerpt;
}

function generateFutureAndPastTimes(
  index: number,
  timeDelta?: {
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
  }
) {
  const oneHourInMillis = 3_600_000;
  const oneDayInMillis = 86_400_000;
  const oneWeekInMillis = 604_800_000;
  const oneMonthInMillis = 2_628_000_000;
  const oneYearInMillis = 31_540_000_000;
  const now = new Date();
  const nowPlusTimeDeltaInMillis =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    ).getTime() +
    (timeDelta?.hours ? oneHourInMillis * timeDelta.hours : 0) +
    (timeDelta?.days ? oneDayInMillis * timeDelta.days : 0) +
    (timeDelta?.weeks ? oneWeekInMillis * timeDelta.weeks : 0) +
    (timeDelta?.months ? oneMonthInMillis * timeDelta.months : 0) +
    (timeDelta?.years ? oneYearInMillis * timeDelta.years : 0);
  const futurePastSwitcher = index % 2 === 0 ? 1 : -1;

  // Generating future and past times in a daily turnus, depending on the given index
  const futurePastTimeInMillis =
    index * futurePastSwitcher * (oneDayInMillis / 2) +
    nowPlusTimeDeltaInMillis;
  const futurePastDate = new Date(futurePastTimeInMillis);

  return futurePastDate;
}

function generateStartTime<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>, index: number) {
  // event required
  let startTime;
  if (entityType === "event") {
    if (entityStructure === "Depth2") {
      // Depth 2 events start 6 hours earlier to better add childEvents
      const timeDelta = {
        hours: -6,
      };
      startTime = generateFutureAndPastTimes(index, timeDelta);
    } else if (entityStructure === "Depth3") {
      // Depth 2 events start 12 hours earlier to better add childEvents
      const timeDelta = {
        hours: -12,
      };
      startTime = generateFutureAndPastTimes(index, timeDelta);
    } else {
      startTime = generateFutureAndPastTimes(index);
    }
  }
  return startTime;
}

function generateEndTime<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>, index: number) {
  // event required
  let endTime;
  if (entityType === "event") {
    if (entityStructure === "Depth2") {
      // 2 day long event (to be able to add the one day seperated child events)
      const timeDelta = {
        days: 2,
      };
      endTime = generateFutureAndPastTimes(index, timeDelta);
    } else if (entityStructure === "Depth3") {
      // 4 day long event (to be able to add the two day long child events (see Depth2))
      const timeDelta = {
        days: 4,
      };
      endTime = generateFutureAndPastTimes(index, timeDelta);
    } else {
      // Hourly event
      const timeDelta = {
        hours: faker.datatype.number({ min: 1, max: 4 }),
      };
      endTime = generateFutureAndPastTimes(index, timeDelta);
    }
  }
  return endTime;
}

function generateDescription<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event, project, document
  let description;
  if (
    entityType === "project" ||
    entityType === "event" ||
    entityType === "document"
  ) {
    const descriptionForLargest =
      entityType === "project"
        ? faker.lorem.paragraphs(50)
        : entityType === "event"
        ? faker.lorem.paragraphs(7).substring(0, 1000)
        : faker.lorem.sentences(5).substring(0, 100);
    const descriptionForStandard =
      entityType === "project" || entityType === "event"
        ? faker.lorem.paragraphs(3)
        : faker.lorem.sentence();
    if (entityStructure === "Smallest") {
      description = null;
    } else if (entityStructure === "Empty Strings") {
      description = "";
    } else if (entityStructure === "Unicode") {
      description = "A description containing unicode character_Γ";
    } else if (entityStructure === "Largest") {
      description = descriptionForLargest;
    } else {
      description = descriptionForStandard;
    }
  }
  return description;
}

function generateSubline<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event, award required
  let subline;
  if (entityType === "event" || entityType === "award") {
    const sublineForLargest =
      entityType === "award"
        ? faker.lorem.paragraphs(3)
        : faker.lorem.sentences(5).substring(0, 70);
    if (entityStructure === "Smallest" && entityType === "event") {
      subline = null;
    } else if (entityStructure === "Empty Strings") {
      subline = "";
    } else if (entityStructure === "Unicode") {
      subline = "A subline containing unicode character_Γ";
    } else if (entityStructure === "Largest") {
      subline = sublineForLargest;
    } else {
      subline = faker.lorem.sentence();
    }
  }
  return subline;
}

function generatePublished<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event (default false)
  let published;
  if (entityType === "event") {
    if (entityStructure === "Unpublished") {
      published = false;
    } else {
      published = true;
    }
  }
  return published;
}

function generateConferenceLink<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event
  let conferenceLink;
  if (entityType === "event") {
    if (entityStructure === "Smallest") {
      conferenceLink = null;
    } else if (entityStructure === "Empty Strings") {
      conferenceLink = "";
    } else if (entityStructure === "Unicode") {
      conferenceLink = "https://unicode.conference.link/Γ";
    } else {
      conferenceLink = faker.internet.url();
    }
  }
  return conferenceLink;
}

function generateConferenceCode<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event
  let conferenceCode;
  if (entityType === "event") {
    if (entityStructure === "Smallest") {
      conferenceCode = null;
    } else if (entityStructure === "Empty Strings") {
      conferenceCode = "";
    } else {
      conferenceCode = faker.datatype
        .number({ min: 100000, max: 999999 })
        .toString();
    }
  }
  return conferenceCode;
}

function generateParticipantLimit<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  index: number,
  numberOfStandardEntities: number
) {
  // event
  let participantLimit;
  const participantLimitSwitcher =
    index % 2 === 0 ? null : faker.datatype.number({ min: 1, max: 300 });
  if (entityType === "event") {
    if (entityStructure === "Smallest") {
      participantLimit = null;
    } else if (
      entityStructure === "Full Participants" ||
      entityStructure === "Overfull Participants" ||
      entityStructure === "Largest"
    ) {
      participantLimit = numberOfStandardEntities / 2;
    } else {
      participantLimit = participantLimitSwitcher;
    }
  }
  return participantLimit;
}

function generateParticipationFrom<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, index: number) {
  // event (default now)
  let participationFrom;
  if (entityType === "event") {
    const timeDelta = {
      days: -22,
    };
    participationFrom = generateFutureAndPastTimes(index, timeDelta);
  }
  return participationFrom;
}

function generateParticipationUntil<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, index: number) {
  // event required
  let participationUntil;
  if (entityType === "event") {
    const timeDelta = {
      days: -1,
    };
    participationUntil = generateFutureAndPastTimes(index, timeDelta);
  }
  return participationUntil;
}

function generateVenueName<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event
  let venueName;
  if (entityType === "event") {
    if (entityStructure === "Smallest") {
      venueName = null;
    } else if (entityStructure === "Empty Strings") {
      venueName = "";
    } else if (entityStructure === "Unicode") {
      venueName = "Unicode venue_Γ";
    } else if (entityStructure === "Largest") {
      venueName =
        "Large Event Space With A Large Name And Also Large Rooms - Almost Everything Is Large";
    } else {
      venueName = faker.company.name();
    }
  }
  return venueName;
}

function generateVenueStreet<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event
  let venueStreet;
  if (entityType === "event") {
    if (entityStructure === "Smallest") {
      venueStreet = null;
    } else if (entityStructure === "Empty Strings") {
      venueStreet = "";
    } else if (entityStructure === "Unicode") {
      venueStreet = "Unicodestreet_Γ";
    } else if (entityStructure === "Largest") {
      venueStreet = "Veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeerylongstreet";
    } else {
      venueStreet = faker.address.street();
    }
  }
  return venueStreet;
}

function generateVenueStreetNumber<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event
  let venueStreetNumber;
  if (entityType === "event") {
    if (entityStructure === "Smallest") {
      venueStreetNumber = null;
    } else if (entityStructure === "Empty Strings") {
      venueStreetNumber = "";
    } else if (entityStructure === "Largest") {
      venueStreetNumber = faker.datatype
        .number({ min: 1000, max: 9999 })
        .toString();
    } else {
      venueStreetNumber = faker.datatype
        .number({ min: 1, max: 999 })
        .toString();
    }
  }
  return venueStreetNumber;
}

function generateVenueCity<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event
  let venueCity;
  if (entityType === "event") {
    if (entityStructure === "Smallest") {
      venueCity = null;
    } else if (entityStructure === "Empty Strings") {
      venueCity = "";
    } else if (entityStructure === "Unicode") {
      venueCity = "Unicode City_Γ";
    } else if (entityStructure === "Largest") {
      venueCity = "The City Of The Greatest And Largest";
    } else {
      venueCity = faker.address.cityName();
    }
  }
  return venueCity;
}

function generateVenueZipCode<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event
  let venueZipCode;
  if (entityType === "event") {
    if (entityStructure === "Smallest") {
      venueZipCode = null;
    } else if (entityStructure === "Empty Strings") {
      venueZipCode = "";
    } else if (entityStructure === "Largest") {
      venueZipCode = faker.datatype
        .number({ min: 1000000000, max: 9999999999 })
        .toString();
    } else {
      venueZipCode = faker.address.zipCode();
    }
  }
  return venueZipCode;
}

function generateCanceled<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // event (default false)
  let canceled;
  if (entityType === "event") {
    if (entityStructure === "Canceled") {
      canceled = true;
    } else {
      canceled = false;
    }
  }
  return canceled;
}

function generateEmail<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>, index: number) {
  // profile required, organization, project
  let email;
  if (entityType === "profile") {
    email = `${entityStructure.replace(" ", "")}@${entityType.replace(
      " ",
      ""
    )}${index}.org`;
  }
  if (entityType === "organization" || entityType === "project") {
    if (entityStructure === "Smallest") {
      email = null;
    } else if (entityStructure === "Empty Strings") {
      email = "";
    } else if (entityStructure === "Unicode") {
      email = "unicode_Γ@email.org";
    } else if (entityStructure === "Largest") {
      email = "a.very.large.email.address@LargeEmailAdresses.com";
    } else {
      email = faker.internet.email();
    }
  }
  return email;
}

function generatePhone<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile, organization, project
  let phone;
  faker.locale = "de";
  if (
    entityType === "profile" ||
    entityType === "organization" ||
    entityType === "project"
  ) {
    if (entityStructure === "Smallest") {
      phone = null;
    } else if (entityStructure === "Empty Strings") {
      phone = "";
    } else if (entityStructure === "Largest") {
      phone = "0123456/7891011121314151617181920";
    } else {
      phone = faker.phone.number();
    }
  }
  faker.locale = "en";
  return phone;
}

function generateStreet<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization, project
  let street;
  if (entityType === "organization" || entityType === "project") {
    if (entityStructure === "Smallest") {
      street = null;
    } else if (entityStructure === "Empty Strings") {
      street = "";
    } else if (entityStructure === "Unicode") {
      street = "Unicodestreet_Γ";
    } else if (entityStructure === "Largest") {
      street = "Veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeerylongstreet";
    } else {
      street = faker.address.street();
    }
  }
  return street;
}

function generateStreetNumber<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization, project
  let streetNumber;
  if (entityType === "organization" || entityType === "project") {
    if (entityStructure === "Smallest") {
      streetNumber = null;
    } else if (entityStructure === "Empty Strings") {
      streetNumber = "";
    } else if (entityStructure === "Largest") {
      streetNumber = faker.datatype.number({ min: 1000, max: 9999 }).toString();
    } else {
      streetNumber = faker.datatype.number({ min: 1, max: 999 }).toString();
    }
  }
  return streetNumber;
}

function generateCity<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization, project
  let city;
  if (entityType === "organization" || entityType === "project") {
    if (entityStructure === "Smallest") {
      city = null;
    } else if (entityStructure === "Empty Strings") {
      city = "";
    } else if (entityStructure === "Unicode") {
      city = "Unicode City_Γ";
    } else if (entityStructure === "Largest") {
      city = "The City Of The Greatest And Largest";
    } else {
      city = faker.address.cityName();
    }
  }
  return city;
}

function generateZipCode<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization, project
  let zipCode;
  if (entityType === "organization" || entityType === "project") {
    if (entityStructure === "Smallest") {
      zipCode = null;
    } else if (entityStructure === "Empty Strings") {
      zipCode = "";
    } else if (entityStructure === "Largest") {
      zipCode = faker.datatype
        .number({ min: 1000000000, max: 9999999999 })
        .toString();
    } else {
      zipCode = faker.address.zipCode();
    }
  }
  return zipCode;
}

function generateWebsite<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile, organization, project
  let website;
  if (
    entityType === "profile" ||
    entityType === "organization" ||
    entityType === "project"
  ) {
    if (entityStructure === "Smallest") {
      website = null;
    } else if (entityStructure === "Empty Strings") {
      website = "";
    } else if (entityStructure === "Unicode") {
      website = "https://unicode.website.org/Γ";
    } else if (entityStructure === "Largest") {
      website =
        "https://www.veeeeeeeeeeeeery-laaaaaaaaaaaaaaaaaaarge-website.com/with-an-enourmus-sluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuug?andsomerandom=param";
    } else {
      website = faker.internet.url();
    }
  }
  return website;
}

function setLogo<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  bucketData: EntityTypeOnBucketData<T>
) {
  // award required, organization, project
  let logoPath;
  if ("logo" in bucketData && bucketData.logo !== undefined) {
    if (entityType === "award") {
      logoPath = bucketData.logo.path;
    }
    if (entityType === "organization" || entityType === "project") {
      if (entityStructure === "Smallest") {
        logoPath = null;
      } else {
        logoPath = bucketData.logo.path;
      }
    }
  }
  return logoPath;
}

function setAvatar<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  bucketData: EntityTypeOnBucketData<T>
) {
  // profile
  let avatarPath;
  if ("avatar" in bucketData && bucketData.avatar !== undefined) {
    if (entityType === "profile") {
      if (entityStructure === "Smallest") {
        avatarPath = null;
      } else {
        avatarPath = bucketData.avatar.path;
      }
    }
  }
  return avatarPath;
}

function setBackground<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  bucketData: EntityTypeOnBucketData<T>
) {
  // organization, project, profile, event
  let backgroundPath;
  if ("background" in bucketData && bucketData.background !== undefined) {
    if (
      entityType === "organization" ||
      entityType === "project" ||
      entityType === "event" ||
      entityType === "profile"
    ) {
      if (entityStructure === "Smallest") {
        backgroundPath = null;
      } else {
        backgroundPath = bucketData.background.path;
      }
    }
  }
  return backgroundPath;
}

function generateSocialMediaUrl<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  socialMediaService: SocialMediaService
) {
  // profile, organization, project
  let website;
  let slugDifference;
  if (
    entityType === "profile" ||
    entityType === "organization" ||
    entityType === "project"
  ) {
    if (entityType === "profile") {
      if (socialMediaService === "linkedin") {
        slugDifference = "in/";
      }
      if (socialMediaService === "xing") {
        slugDifference = "profile/";
      }
    } else {
      if (socialMediaService === "linkedin") {
        slugDifference = "company/";
      }
      if (socialMediaService === "xing") {
        slugDifference = "pages/";
      }
    }
    if (entityStructure === "Smallest") {
      website = null;
    } else if (entityStructure === "Empty Strings") {
      website = "";
    } else if (entityStructure === "Largest") {
      website = `https://www.${socialMediaService}.com/${
        slugDifference || ""
      }with-an-enourmus-sluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuug?andsomerandom=param`;
    } else if (entityStructure === "Unicode") {
      website = `https://www.${socialMediaService}.com/${
        slugDifference || ""
      }unicode-slug-Γ`;
    } else {
      website = `https://www.${socialMediaService}.com/${
        slugDifference || ""
      }${faker.helpers.slugify(`${entityStructure}${entityType}`)}`;
    }
  }
  return website;
}

function generateBio<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile, organization
  let bio;
  if (entityType === "profile" || entityType === "organization") {
    const bioForLargest = faker.lorem.paragraphs(7).substring(0, 500);
    const bioForStandard = faker.lorem.paragraphs(1);
    if (entityStructure === "Smallest") {
      bio = null;
    } else if (entityStructure === "Empty Strings") {
      bio = "";
    } else if (entityStructure === "Unicode") {
      bio = "A bio containing unicode character_Γ";
    } else if (entityStructure === "Largest") {
      bio = bioForLargest;
    } else {
      bio = bioForStandard;
    }
  }
  return bio;
}

function generateQuote<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization
  let quote;
  if (entityType === "organization") {
    const quoteForLargest = faker.lorem.paragraphs(3).substring(0, 300);
    const quoteForStandard = faker.lorem.paragraphs(1);
    if (entityStructure === "Smallest") {
      quote = null;
    } else if (entityStructure === "Empty Strings") {
      quote = "";
    } else if (entityStructure === "Unicode") {
      quote = "A quote containing unicode character_Γ";
    } else if (entityStructure === "Largest") {
      quote = quoteForLargest;
    } else {
      quote = quoteForStandard;
    }
  }
  return quote;
}

function generateQuoteAuthor<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization
  let quoteAuthor;
  if (entityType === "organization") {
    if (entityStructure === "Smallest") {
      quoteAuthor = null;
    } else if (entityStructure === "Empty Strings") {
      quoteAuthor = "";
    } else if (entityStructure === "Unicode") {
      quoteAuthor = "Mister Unicode_Γ";
    } else if (entityStructure === "Largest") {
      quoteAuthor =
        "Oscar Wiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiilde";
    } else {
      quoteAuthor = faker.name.fullName();
    }
  }
  return quoteAuthor;
}

function generateQuoteAuthorInformation<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization
  let quoteAuthorInformation;
  if (entityType === "organization") {
    if (entityStructure === "Smallest") {
      quoteAuthorInformation = null;
    } else if (entityStructure === "Empty Strings") {
      quoteAuthorInformation = "";
    } else if (entityStructure === "Unicode") {
      quoteAuthorInformation = "Involved in unicode business_Γ";
    } else if (entityStructure === "Largest") {
      quoteAuthorInformation =
        "A very laaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaarge job title of the author";
    } else {
      quoteAuthorInformation = faker.name.jobTitle();
    }
  }
  return quoteAuthorInformation;
}

function generateSupportedBy<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization
  let supportedBy;
  if (entityType === "organization") {
    if (entityStructure === "Smallest") {
      supportedBy = [];
    } else if (entityStructure === "Empty Strings") {
      supportedBy = ["", "", ""];
    } else if (entityStructure === "Unicode") {
      supportedBy = ["Unicode company_Γ"];
    } else if (entityStructure === "Largest") {
      supportedBy = [];
      for (let i = 0; i < 30; i++) {
        supportedBy.push(faker.company.name());
      }
    } else {
      supportedBy = [];
      let iterations = faker.datatype.number({ min: 1, max: 10 });
      for (let i = 0; i < iterations; i++) {
        supportedBy.push(faker.company.name());
      }
    }
  }
  return supportedBy;
}

function generateSkills<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile
  let skills;
  if (entityType === "profile") {
    if (entityStructure === "Smallest") {
      skills = [];
    } else if (entityStructure === "Empty Strings") {
      skills = ["", "", ""];
    } else if (entityStructure === "Unicode") {
      skills = ["Unicode skill_Γ"];
    } else if (entityStructure === "Largest") {
      skills = [];
      for (let i = 0; i < 30; i++) {
        skills.push(faker.name.jobArea());
      }
    } else {
      skills = [];
      let iterations = faker.datatype.number({ min: 1, max: 10 });
      for (let i = 0; i < iterations; i++) {
        skills.push(faker.name.jobArea());
      }
    }
  }
  return skills;
}

function generateInterests<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile
  let interests;
  if (entityType === "profile") {
    if (entityStructure === "Smallest") {
      interests = [];
    } else if (entityStructure === "Empty Strings") {
      interests = ["", "", ""];
    } else if (entityStructure === "Unicode") {
      interests = ["Unicode interest_Γ"];
    } else if (entityStructure === "Largest") {
      interests = [];
      for (let i = 0; i < 30; i++) {
        interests.push(faker.hacker.phrase());
      }
    } else {
      interests = [];
      let iterations = faker.datatype.number({ min: 1, max: 10 });
      for (let i = 0; i < iterations; i++) {
        interests.push(faker.hacker.phrase());
      }
    }
  }
  return interests;
}

function generateAcademicTitle<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile
  let academicTitle;
  const academicTitles = [null, "", "Dr.", "Prof.", "Prof. Dr."];
  if (entityType === "profile") {
    if (entityStructure === "Smallest") {
      academicTitle = null;
    } else if (entityStructure === "Empty Strings") {
      academicTitle = "";
    } else if (entityStructure === "Largest") {
      academicTitle = "Prof. Dr.";
    } else {
      let index = faker.datatype.number({ min: 0, max: 4 });
      academicTitle = academicTitles[index];
    }
  }
  return academicTitle;
}

function generateFirstName<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  useRealNames: boolean
) {
  // profile required
  let firstName;
  if (entityType === "profile") {
    if (useRealNames) {
      if (entityStructure === "Largest") {
        firstName = "Alexandros-Lukas-Nikolai-Ioanis-Giorgios-Petros";
      } else {
        firstName = faker.name.firstName();
      }
    } else {
      if (entityStructure === "Developer") {
        firstName = `0_${entityStructure}`;
      } else if (entityStructure === "Standard") {
        firstName = `Y_${entityStructure}`;
      } else {
        firstName = entityStructure;
      }
    }
  }
  return firstName;
}

function generateLastName<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  useRealNames: boolean
) {
  // profile required
  let lastName;
  if (entityType === "profile") {
    if (useRealNames) {
      if (entityStructure === "Largest") {
        lastName = "Di-Savoia-Aosta-Carignano-Genova-Montferrat-Casa-Nuova";
      } else {
        lastName = faker.name.lastName();
      }
    } else {
      lastName = entityType;
    }
  }
  return lastName;
}

function generatePublicFields<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile, organization
  let publicFields;
  if (entityType === "profile" || entityType === "organization") {
    let alwaysPublicFields;
    let privateFields;
    if (entityType === "profile") {
      alwaysPublicFields = [
        "id",
        "username",
        "firstName",
        "lastName",
        "academicTitle",
        "areas",
        "avatar",
        "background",
        "memberOf",
        "teamMemberOfProjects",
      ];
      privateFields = [
        "email",
        "website",
        "facebook",
        "linkedin",
        "twitter",
        "xing",
        "bio",
        "skills",
        "interests",
        "createdAt",
        "publicFields",
        "termsAccepted",
        "termsAcceptedAt",
        "updatedAt",
        "position",
        "instagram",
        "youtube",
        "offers",
        "participatedEvents",
        "seekings",
        "contributedEvents",
        "teamMemberOfEvents",
        "waitingForEvents",
      ];
    } else {
      alwaysPublicFields = [
        "name",
        "slug",
        "street",
        "streetNumber",
        "zipCode",
        "city",
        "logo",
        "background",
        "types",
        "supportedBy",
        "publicFields",
        "teamMembers",
        "memberOf",
        "networkMembers",
        "createdAt",
        "areas",
        "responsibleForEvents",
        "responsibleForProject",
      ];
      privateFields = [
        "id",
        "email",
        "phone",
        "website",
        "facebook",
        "linkedin",
        "twitter",
        "xing",
        "bio",
        "quote",
        "quoteAuthor",
        "quoteAuthorInformation",
        "updatedAt",
        "instagram",
        "youtube",
        "focuses",
      ];
    }
    if (entityStructure === "Public") {
      publicFields = [...alwaysPublicFields, ...privateFields];
    } else if (entityStructure === "Private") {
      publicFields = alwaysPublicFields;
    } else {
      publicFields = [
        ...alwaysPublicFields,
        ...privateFields.filter(
          () =>
            Math.random() <
            faker.datatype.number({ min: 0, max: privateFields.length }) /
              privateFields.length
        ),
      ];
    }
  }
  return publicFields;
}

function generateTermsAccepted<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T) {
  // profile required
  let termsAccepted;
  if (entityType === "profile") {
    termsAccepted = true;
  }
  return termsAccepted;
}

function generatePosition<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile
  let position;
  if (entityType === "profile") {
    if (entityStructure === "Smallest") {
      position = null;
    } else if (entityStructure === "Empty Strings") {
      position = "";
    } else if (entityStructure === "Unicode") {
      position = "Involved in unicode business_Γ";
    } else if (entityStructure === "Largest") {
      position =
        "A very laaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaarge job title";
    } else {
      position = faker.name.jobTitle();
    }
  }
  return position;
}
