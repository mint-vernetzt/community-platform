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
  singleAwarded: "Single Awarded";
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
  return authClient;
}

export function setFakerSeed(seed: number) {
  faker.seed(seed);
}

export async function truncateTables() {
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
  } catch (error) {
    console.log({ error });
  }
}

export async function emptyBuckets(
  authClient: SupabaseClient<any, "public", any>
) {
  const { error: imageBucketError } = await authClient.storage.emptyBucket(
    "images"
  );
  const { error: documentBucketError } = await authClient.storage.emptyBucket(
    "documents"
  );
  if (imageBucketError !== null) {
    console.error(
      "The image bucket could not be emptied. Please try to manually empty it (f.e. via Supabase Studio) and run the seed script again. If you don't have a bucket named 'images', please run the supabase.enhancements.sql (located in the root directory) in Supabase Studio -> SQL Queries."
    );
  }
  if (documentBucketError !== null) {
    console.error(
      "The document bucket could not be emptied. Please try to manually empty it (f.e. via Supabase Studio) and run the seed script again. If you don't have a bucket named 'documents', please run the supabase.enhancements.sql (located in the root directory) in Supabase Studio -> SQL Queries."
    );
  }
}

export async function deleteUsers(
  authClient: SupabaseClient<any, "public", any>
) {
  const {
    data: { users },
    error: listUsersError,
  } = await authClient.auth.admin.listUsers();

  if (listUsersError !== null || users.length === 0) {
    console.error(
      "Could not fetch already existing users from auth.users table. Skipped deleting all users from auth.users table. Either there were no users in auth.users table before running this script or the users could not be fetched."
    );
  } else {
    for (let user of users) {
      const { error: deleteUserError } = await authClient.auth.admin.deleteUser(
        user.id
      );

      if (deleteUserError !== null) {
        console.error(
          `The user with the id "${user.id}" and the email "${user.email}" could not be deleted. Please try to manually delete it (f.e. via Supabase Studio) and run the seed script again.`
        );
      }
    }
  }
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
        const arrayBuffer = await response.arrayBuffer();
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
        const hash = await createHashFromString(
          Buffer.from(arrayBuffer).toString()
        );
        const path = generatePathName(
          fileTypeResult.ext,
          hash,
          imageType.substring(0, imageType.length - 1)
        );
        const { error: uploadObjectError } = await authClient.storage
          .from("images")
          .upload(path, arrayBuffer, {
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
        bucketData[imageType as ImageType].push(path);
        console.log(
          `Successfully fetched image from ${imgUrl} and added it to bucket images.`
        );
      }
    }
  } catch (e) {
    console.log(e);
    console.error("\nCould not fetch images from pravatar.cc:\n");
    throw e;
  }
  return bucketData;
}

function getImageUrl(imageType?: ImageType) {
  if (imageType === "avatars") {
    return faker.image.avatar();
  }
  if (imageType === "logos") {
    return faker.image.abstract(640, 480, true);
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
  useRealNames: boolean
) {
  let profileEmails: string[] = [];
  let profileIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let organizationIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let eventIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let projectIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let awardIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let documentIds: Array<Awaited<ReturnType<typeof seedEntity>>> = [];
  let someProfileIds;
  let someOrganizationIds;
  let someDocumentIds;
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

  console.log("\n--- Seeding all entities ---\n");

  // Seeding some standard profiles to add to specific entities later
  for (let i = 0; i <= 20; i++) {
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
      useRealNames
    );
    const standardProfileId = await seedEntity<"profile">(
      "profile",
      standardProfile,
      authClient,
      defaultPassword
    );
    await addBasicProfileRelations(standardProfileId, areas, offersAndSeekings);
    profileIds.push(standardProfileId);
    profileEmails.push(standardProfile.email);
    console.log(
      `Successfully seeded standard profile with id: ${standardProfileId}`
    );
  }

  // Seeding some standard organizations to add to specific entities later
  for (let i = 0; i <= 20; i++) {
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
      useRealNames
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
    someProfileIds = getRandomUniqueSubset<ArrayElement<typeof profileIds>>(
      profileIds,
      faker.datatype.number({ min: 1, max: 10 })
    );
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
      ArrayElement<typeof organizationIds>
    >(organizationIds, faker.datatype.number({ min: 1, max: 10 }));
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
    organizationIds.push(standardOrganizationId);
    console.log(
      `Successfully seeded standard organization with id: ${standardOrganizationId}`
    );
  }

  // Seeding the standard documents and awards to connect them later where they are needed
  for (let i = 0; i <= 20; i++) {
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
      useRealNames
    );
    const standardDocumentId = await seedEntity<"document">(
      "document",
      standardDocument,
      authClient,
      defaultPassword
    );
    documentIds.push(standardDocumentId);
    console.log(
      `Successfully seeded standard document with id: ${standardDocumentId}`
    );
  }
  for (let i = 0; i <= 20; i++) {
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
      useRealNames
    );
    const standardAwardId = await seedEntity<"award">(
      "award",
      standardAward,
      authClient,
      defaultPassword
    );
    awardIds.push(standardAwardId);
    console.log(
      `Successfully seeded standard award with id: ${standardAwardId}`
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
    useRealNames
  );
  const developerProfileId = await seedEntity<"profile">(
    "profile",
    developerProfile,
    authClient,
    defaultPassword
  );
  await addBasicProfileRelations(developerProfileId, areas, offersAndSeekings);
  profileIds.push(developerProfileId);
  profileEmails.push(developerProfile.email);
  console.log(
    `Successfully seeded developer profile with id: ${developerProfileId}`
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
    useRealNames
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
  someProfileIds = getRandomUniqueSubset<ArrayElement<typeof profileIds>>(
    profileIds,
    faker.datatype.number({ min: 1, max: 10 })
  ).filter((id) => {
    return id !== developerProfileId;
  });
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
  organizationIds.push(developerOrganizationId);
  console.log(
    `Successfully seeded developer organization with id: ${developerOrganizationId}`
  );

  // Seeding developer events
  for (let i = 0; i < 50; i++) {
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
      useRealNames
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
      ArrayElement<typeof profileIds>
    >(profileIds, 4);
    await prismaClient.teamMemberOfEvent.createMany({
      data: [
        {
          profileId: developerProfileId,
          eventId: developerEventId,
          isPrivileged: true,
        },
        ...someProfileIds[0]
          .filter((id) => {
            return id !== developerProfileId;
          })
          .map((id) => {
            return {
              profileId: id,
              eventId: developerEventId,
            };
          }),
      ],
    });
    await prismaClient.speakerOfEvent.createMany({
      data: [
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
        developerEvent.participantLimit || undefined
      );
      await prismaClient.participantOfEvent.createMany({
        data: [
          ...participantIds.map((id) => {
            return {
              profileId: id,
              eventId: developerEventId,
            };
          }),
        ],
      });
      if (participantIds.length === developerEvent.participantLimit) {
        await prismaClient.waitingParticipantOfEvent.createMany({
          data: [
            ...someProfileIds[3].map((id) => {
              return {
                profileId: id,
                eventId: developerEventId,
              };
            }),
          ],
        });
      }
    }
    someOrganizationIds = getRandomUniqueSubset<
      ArrayElement<typeof organizationIds>
    >(organizationIds, faker.datatype.number({ min: 1, max: 10 })).filter(
      (id) => {
        return id !== developerOrganizationId;
      }
    );
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
    someDocumentIds = getRandomUniqueSubset<ArrayElement<typeof documentIds>>(
      documentIds,
      faker.datatype.number({ min: 1, max: 10 })
    );
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
    eventIds.push(developerEventId);
    console.log(
      `Successfully seeded developer event with id: ${developerEventId}`
    );
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
    useRealNames
  );
  const developerProjectId = await seedEntity<"project">(
    "project",
    developerProject,
    authClient,
    defaultPassword
  );
  await addBasicProjectRelations(developerProjectId, disciplines, targetGroups);
  someProfileIds = getRandomUniqueSubset<ArrayElement<typeof profileIds>>(
    profileIds,
    faker.datatype.number({ min: 1, max: 10 })
  ).filter((id) => {
    return id !== developerProfileId;
  });
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
    ArrayElement<typeof organizationIds>
  >(organizationIds, faker.datatype.number({ min: 1, max: 10 })).filter(
    (id) => {
      return id !== developerOrganizationId;
    }
  );
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
  projectIds.push(developerProjectId);
  console.log(
    `Successfully seeded developer project with id: ${developerProjectId}`
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
  useRealNames: boolean
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
    startTime: generateStartTime<T>(entityType, index),
    endTime: generateEndTime<T>(entityType, entityStructure, index),
    description: generateDescription<T>(entityType, entityStructure),
    subline: generateSubline<T>(entityType, entityStructure),
    published: generatePublished<T>(entityType, entityStructure),
    conferenceLink: generateConferenceLink<T>(entityType, entityStructure),
    conferenceCode: generateConferenceCode<T>(entityType, entityStructure),
    participantLimit: generateParticipantLimit<T>(
      entityType,
      entityStructure,
      index
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
      result = await prismaClient.profile.update({
        where: { id: data.user.id },
        data: entity,
        select: { id: true },
      });
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
  offersAndSeekings: { id: string }[]
) {
  const someAreas = getRandomUniqueSubset<ArrayElement<typeof areas>>(
    areas,
    faker.datatype.number({ min: 1, max: 10 })
  );
  const someOffers =
    getRandomUniqueSubset<ArrayElement<typeof offersAndSeekings>>(
      offersAndSeekings
    );
  const someSeekings =
    getRandomUniqueSubset<ArrayElement<typeof offersAndSeekings>>(
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
  organizationTypes: { id: string }[]
) {
  const someAreas = getRandomUniqueSubset<ArrayElement<typeof areas>>(
    areas,
    faker.datatype.number({ min: 1, max: 10 })
  );
  const someFocuses =
    getRandomUniqueSubset<ArrayElement<typeof focuses>>(focuses);
  const someOrganizationTypes =
    getRandomUniqueSubset<ArrayElement<typeof organizationTypes>>(
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
  targetGroups: { id: string }[]
) {
  const someAreas = getRandomUniqueSubset<ArrayElement<typeof areas>>(
    areas,
    faker.datatype.number({ min: 1, max: 10 })
  );
  const someFocuses =
    getRandomUniqueSubset<ArrayElement<typeof focuses>>(focuses);
  const someEventTypes =
    getRandomUniqueSubset<ArrayElement<typeof eventTypes>>(eventTypes);
  const someExperienceLevel = getRandomUniqueSubset<
    ArrayElement<typeof experienceLevels>
  >(experienceLevels, 1);
  const someStage = getRandomUniqueSubset<ArrayElement<typeof stages>>(
    stages,
    1
  );
  const someTags = getRandomUniqueSubset<ArrayElement<typeof tags>>(tags);
  const someTargetGroups =
    getRandomUniqueSubset<ArrayElement<typeof targetGroups>>(targetGroups);
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
  targetGroups: { id: string }[]
) {
  const someDisciplines =
    getRandomUniqueSubset<ArrayElement<typeof disciplines>>(disciplines);
  const someTargetGroups =
    getRandomUniqueSubset<ArrayElement<typeof targetGroups>>(targetGroups);
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
      username = generateUsername_app("!Developer", `Profile${index}`);
    } else if (entityStructure === "Unicode") {
      username = generateUsername_app(
        `${entityStructure}_Γ`,
        `Profile_Γ${index}`
      );
    } else if (entityStructure === "Standard") {
      username = generateUsername_app("~Standard", `Profile${index}`);
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
        name = `!${entityStructure} ${entityType.replace(
          /^./,
          function (match) {
            return match.toUpperCase();
          }
        )}`;
      } else if (entityStructure === "Standard") {
        name = `~${entityStructure} ${entityType.replace(
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
      slug = generateOrganizationSlug(`!${entityStructure} Organization`);
    } else if (entityStructure === "Standard") {
      slug = generateOrganizationSlug(`~${entityStructure} Organization`);
    } else if (entityStructure === "Unicode") {
      slug = generateOrganizationSlug(`${entityStructure} Organization_Γ`);
    } else {
      slug = generateOrganizationSlug(`${entityStructure} Organization`);
    }
  }
  if (entityType === "event") {
    if (entityStructure === "Developer") {
      slug = generateEventSlug(`!${entityStructure} Event`);
    } else if (entityStructure === "Standard") {
      slug = generateEventSlug(`~${entityStructure} Event`);
    } else if (entityStructure === "Unicode") {
      slug = generateEventSlug(`${entityStructure} Event_Γ`);
    } else {
      slug = generateEventSlug(`${entityStructure} Event`);
    }
  }
  if (entityType === "project") {
    if (entityStructure === "Developer") {
      slug = generateProjectSlug(`!${entityStructure} Project`);
    } else if (entityStructure === "Standard") {
      slug = generateProjectSlug(`~${entityStructure} Project`);
    } else if (entityStructure === "Unicode") {
      slug = generateProjectSlug(`${entityStructure} Project_Γ`);
    } else {
      slug = generateProjectSlug(`${entityStructure} Project`);
      console.log(slug);
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
    days?: number;
    hours?: number;
  }
) {
  const now = new Date();
  const futurePastSwitcher = index % 2 === 0 ? 1 : -1;
  const middleHourOfDay = 12 + (timeDelta?.hours || 0);
  const middleDayOfMonth = 14 + (timeDelta?.days || 0);
  const middleMonthOfYear = 6 + (timeDelta?.months || 0);
  let newHour;
  let newDate;
  let newMonth;
  let newYear;
  let dateCounter = 0;
  let monthCounter = 0;
  let yearCounter = 0;

  newHour = middleHourOfDay + index * futurePastSwitcher;
  if (newHour < 0 || newHour > 23) {
    if (newHour > 23) {
      dateCounter = newHour - 24;
    }
    if (newHour < 0) {
      dateCounter = newHour + 1;
    }
    newHour = middleHourOfDay;
  }
  newDate = middleDayOfMonth + dateCounter;
  if (newDate <= 0 || newDate >= 29) {
    if (newDate >= 29) {
      monthCounter = newDate - 28;
    }
    if (newDate <= 0) {
      monthCounter = newDate - 1;
    }
    newDate = 1;
  }
  newMonth = middleMonthOfYear + monthCounter;
  if (newMonth < 0 || newMonth > 11) {
    if (newMonth > 11) {
      yearCounter = newMonth - 12;
    }
    if (newMonth < 0) {
      yearCounter = newMonth + 1;
    }
    newMonth = 1;
  }
  newYear = now.getFullYear() + yearCounter + (timeDelta?.years || 0);

  return { hours: newHour, date: newDate, month: newMonth, year: newYear };
}

function generateFutureAndPastTimesNew(
  index: number,
  timeDelta?: {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
  }
) {
  const oneHourInMillis = 3_600_000;
  const oneDayInMillis = 86_400_000;
  const oneMonthInMillis = 2_628_000_000;
  const oneYearInMillis = 31_540_000_000;
  const startTime =
    new Date().getTime() +
    (timeDelta?.hours ? oneHourInMillis : 0) +
    (timeDelta?.days ? oneHourInMillis : 0);
  const futurePastSwitcher = index % 2 === 0 ? 1 : -1;
  const middleHourOfDay = 12 + (timeDelta?.hours || 0);
  const middleDayOfMonth = 14 + (timeDelta?.days || 0);
  const middleMonthOfYear = 6 + (timeDelta?.months || 0);

  return;
}

function generateStartTime<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, index: number) {
  // event required
  let startTime;
  if (entityType === "event") {
    const { hours, date, month, year } = generateFutureAndPastTimes(index);
    startTime = new Date(year, month, date, hours);
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
      // Daily event
      const timeDelta = {
        days: 1,
      };
      const { hours, date, month, year } = generateFutureAndPastTimes(
        index,
        timeDelta
      );
      endTime = new Date(year, month, date, hours);
    } else if (entityStructure === "Depth3") {
      // Weekly event
      const timeDelta = {
        days: 7,
      };
      const { hours, date, month, year } = generateFutureAndPastTimes(
        index,
        timeDelta
      );
      endTime = new Date(year, month, date, hours);
    } else {
      // Hourly event
      const timeDelta = {
        hours: 1,
      };
      const { hours, date, month, year } = generateFutureAndPastTimes(
        index,
        timeDelta
      );
      endTime = new Date(year, month, date, hours);
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
>(entityType: T, entityStructure: EntityTypeOnStructure<T>, index: number) {
  // event
  let participantLimit;
  const participantLimitSwitcher =
    index % 2 === 0 ? null : faker.datatype.number({ min: 1, max: 300 });
  if (entityType === "event") {
    if (entityStructure === "Smallest") {
      participantLimit = null;
    } else if (entityStructure === "Largest") {
      participantLimit = 20;
    } else if (
      entityStructure === "Full Participants" ||
      entityStructure === "Overfull Participants"
    ) {
      participantLimit = 20;
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
      days: -8,
    };
    const { hours, date, month, year } = generateFutureAndPastTimes(
      index,
      timeDelta
    );
    participationFrom = new Date(year, month, date, hours);
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
    const { hours, date, month, year } = generateFutureAndPastTimes(
      index,
      timeDelta
    );
    participationUntil = new Date(year, month, date, hours);
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
    email = `${entityStructure}@${entityType}${index}.org`;
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
      website = `https://www.linkedin.com/${
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
        firstName = `!${entityStructure}`;
      } else if (entityStructure === "Standard") {
        firstName = `~${entityStructure}`;
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
