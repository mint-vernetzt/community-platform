import { faker } from "@faker-js/faker";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { fromBuffer } from "file-type";
import { prismaClient } from "../../../app/prisma";
import {
  generateEventSlug,
  generateOrganizationSlug,
  generateProjectSlug,
  generateUsername as generateUsername_app,
} from "../../../app/utils";
import { generatePathName } from "../../../app/storage.server";
import { createHashFromString } from "../../../app/utils.server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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
  : T extends "organization" | "project" | "event"
  ? Pick<BucketData, "logo" | "background">
  : undefined;

type SocialMediaService =
  | "facebook"
  | "linkedin"
  | "twitter"
  | "instagram"
  | "xing"
  | "youtube";

export type ImageType = "logos" | "backgrounds" | "avatars";

export function checkLocalEnvironment() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error(
      "No database url provided via the .env file. Database could not be seeded."
    );
  }
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

export async function uploadImageBucketData(
  authClient: SupabaseClient<any, "public", any>
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
      // TODO: Make number of images configurable
      for (let i = 1; i <= 50; i++) {
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
  authClient: SupabaseClient<any, "public", any>
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
  // TODO: Make number of documents configurable
  for (let i = 1; i <= 50; i++) {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    // TODO: Make number of pages configurable
    for (let j = 0; j < 10; j++) {
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

export function getEntityData<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(
  entityType: T,
  entityStructure: EntityTypeOnStructure<T>,
  index: number,
  bucketData: EntityTypeOnBucketData<T>
) {
  const entityData: unknown = {
    username: generateUsername<T>(entityType, entityStructure),
    title: generateTitle<T>(entityType, entityStructure),
    date: generateDate<T>(entityType, index),
    shortTitle: generateShortTitle<T>(entityType, entityStructure),
    path: setPath<T>(entityType, bucketData),
    mimeType: setMimeType<T>(entityType, bucketData),
    filename: setFilename<T>(entityType, bucketData),
    extension: setExtension<T>(entityType, bucketData),
    sizeInMB: setSizeInMB<T>(entityType, bucketData),
    name: generateName<T>(entityType, entityStructure),
    slug: generateSlug<T>(entityType, entityStructure),
    headline: generateHeadline<T>(entityType, entityStructure),
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
    email: generateEmail<T>(entityType, entityStructure),
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
    firstName: generateFirstName<T>(entityType, entityStructure),
    lastName: generateLastName<T>(entityType, entityStructure),
    publicFields: generatePublicFields<T>(entityType, entityStructure),
    termsAccepted: generateTermsAccepted<T>(entityType),
    position: generatePosition<T>(entityType, entityStructure),
  };
  return entityData as EntityTypeOnData<T>;
}

export async function seedEntity<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entity: EntityTypeOnData<T>) {
  // TODO: fix union type issue (almost got the generic working, but thats too hard...)
  // What i wanted was: When i pass "profile" as type T then the passed entity must be of type Prisma.ProfileCreateArgs["data"]
  // @ts-ignore
  const result = await prismaClient[entityType].create({
    data: entity,
    select: { id: true },
  });
  return result.id;
}

function generateUsername<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile required unique
  let username;
  if (entityType === "profile") {
    if (entityStructure === "Developer") {
      username = generateUsername_app("_Developer", "Profile");
    } else if (entityStructure === "Unicode") {
      username = generateUsername_app(`${entityStructure}_Γ`, "Profile_Γ");
    } else {
      username = generateUsername_app(entityStructure, "Profile");
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
    date = new Date(`01-01-202${index}`);
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
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization required, event required, project required
  let name;
  if (
    entityType === "organization" ||
    entityType === "event" ||
    entityType === "project"
  ) {
    if (entityStructure === "Developer") {
      name = `_${entityStructure} ${entityType.replace(/^./, function (match) {
        return match.toUpperCase();
      })}`;
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
  return name;
}

function generateSlug<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // organization required unique, event required unique, project required unique, award required unique
  let name;
  if (entityType === "organization") {
    if (entityStructure === "Developer") {
      name = generateOrganizationSlug("_Developer Organization");
    } else if (entityStructure === "Unicode") {
      name = generateOrganizationSlug(`${entityStructure} Organization_Γ`);
    } else {
      name = generateOrganizationSlug(`${entityStructure} Organization`);
    }
  }
  if (entityType === "event") {
    if (entityStructure === "Developer") {
      name = generateEventSlug("_Developer Event");
    } else if (entityStructure === "Unicode") {
      name = generateEventSlug(`${entityStructure} Event_Γ`);
    } else {
      name = generateEventSlug(`${entityStructure} Event`);
    }
  }
  if (entityType === "project") {
    if (entityStructure === "Developer") {
      name = generateProjectSlug("_Developer Project");
    } else if (entityStructure === "Unicode") {
      name = generateProjectSlug(`${entityStructure} Project_Γ`);
    } else {
      name = generateProjectSlug(`${entityStructure} Project`);
    }
  }
  return name;
}

function generateHeadline<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
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
        "Very long project headline - This project headline was created by cn and not by faker - And it gets even longer - Disable the edge cases in the seed script to skip this project when seeding the database";
    } else {
      headline = `${entityStructure} ${entityType.replace(
        /^./,
        function (match) {
          return match.toUpperCase();
        }
      )}`;
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
    } else if (entityStructure === "Empty Strings") {
      participantLimit = -1;
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
      venueStreet = faker.address.streetName();
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
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile required, organization, project
  let email;
  if (entityType === "profile") {
    email = `${entityStructure}@${entityType}.org`;
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
      street = faker.address.streetName();
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
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile required
  let firstName;
  if (entityType === "profile") {
    if (entityStructure === "Largest") {
      firstName = "Alexandros-Lukas-Nikolai-Ioanis-Giorgios-Petros";
    } else {
      firstName = faker.name.firstName();
    }
  }
  return firstName;
}

function generateLastName<
  T extends keyof Pick<
    PrismaClient,
    "profile" | "organization" | "project" | "event" | "award" | "document"
  >
>(entityType: T, entityStructure: EntityTypeOnStructure<T>) {
  // profile required
  let lastName;
  if (entityType === "profile") {
    if (entityStructure === "Largest") {
      lastName = "Di-Savoia-Aosta-Carignano-Genova-Montferrat-Casa-Nuova";
    } else {
      lastName = faker.name.lastName();
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
