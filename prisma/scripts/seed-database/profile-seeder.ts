import { faker } from "@faker-js/faker";
import type { Profile } from "@prisma/client";
import { SupabaseClient } from "@supabase/auth-helpers-remix";
import { prismaClient } from "~/prisma";
import { getScoreOfEntity } from "../update-score/utils";

// TODO: Add static data like focuses, eventTypes, targetGroups, etc...
export function getProfileData(
  entityStructure: EntityStructure,
  index: number,
  bucketData: BucketData,
  useRealNames: boolean,
  numberOfStandardEntities: number
) {
  const profileData: Omit<
    Profile,
    "id" | "termsAcceptedAt" | "updatedAt" | "createdAt" | "score"
  > = {
    username: generateUsername<T>(entityType, entityStructure, index),

    email: generateEmail<T>(entityType, entityStructure, index),
    phone: generatePhone<T>(entityType, entityStructure),
    website: generateWebsite<T>(entityType, entityStructure),

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

    skills: generateSkills<T>(entityType, entityStructure),
    interests: generateInterests<T>(entityType, entityStructure),
    academicTitle: generateAcademicTitle<T>(entityType, entityStructure),
    firstName: generateFirstName<T>(entityType, entityStructure, useRealNames),
    lastName: generateLastName<T>(entityType, entityStructure, useRealNames),
    publicFields: generatePublicFields<T>(entityType, entityStructure),
    termsAccepted: generateTermsAccepted<T>(entityType),
    position: generatePosition<T>(entityType, entityStructure),
  };
  return profileData;
}

// TODO: Do we need this function?
export async function seedProfile(
  entity: Omit<Profile, "id" | "termsAcceptedAt" | "updatedAt" | "createdAt">,
  authClient: SupabaseClient<any, "public", any>,
  defaultPassword: string
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
    return;
  } else {
    try {
      const result = await prismaClient.profile.update({
        where: { id: data.user.id },
        data: entity,
        select: { id: true },
      });
      return result.id as string;
    } catch (e) {
      console.error(e);
      throw new Error(
        "User was created on auth.users table but not on public.profiles table. Are you sure the database trigger to create a profile on user creation is enabled? If not try to run the supabase.enhancements.sql in Supabase Studio."
      );
    }
  }
}

// TODO: Add score on top level
function addScore(
  profileData: Omit<
    Profile,
    "id" | "termsAcceptedAt" | "updatedAt" | "createdAt" | "score"
  >
) {
  const score = getScoreOfEntity(profileData);
  return { ...profileData, score };
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

// TODO: Outsort functions from here upwards
function generateSocialMediaUrl(
  entityStructure: EntityStructure,
  socialMediaService: SocialMediaService
) {
  let website;
  let slugDifference;
  if (socialMediaService === "linkedin") {
    slugDifference = "in/";
  }
  if (socialMediaService === "xing") {
    slugDifference = "profile/";
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
    }${faker.helpers.slugify(`${entityStructure}profile`)}`;
  }
  return website;
}

function generateBio(entityStructure: EntityStructure) {
  let bio;
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

  return bio;
}

function generateSkills(entityStructure: EntityStructure) {
  let skills = [];
  if (entityStructure === "Empty Strings") {
    skills = ["", "", ""];
  } else if (entityStructure === "Unicode") {
    skills = ["Unicode skill_Γ"];
  } else if (entityStructure === "Largest") {
    for (let i = 0; i < 30; i++) {
      skills.push(faker.name.jobArea());
    }
  } else {
    let iterations = faker.datatype.number({ min: 1, max: 10 });
    for (let i = 0; i < iterations; i++) {
      skills.push(faker.name.jobArea());
    }
  }
  return skills;
}

function generateInterests(entityStructure: EntityStructure) {
  let interests = [];
  if (entityStructure === "Empty Strings") {
    interests = ["", "", ""];
  } else if (entityStructure === "Unicode") {
    interests = ["Unicode interest_Γ"];
  } else if (entityStructure === "Largest") {
    for (let i = 0; i < 30; i++) {
      interests.push(faker.hacker.phrase());
    }
  } else {
    let iterations = faker.datatype.number({ min: 1, max: 10 });
    for (let i = 0; i < iterations; i++) {
      interests.push(faker.hacker.phrase());
    }
  }
  return interests;
}

function generateAcademicTitle(entityStructure: EntityStructure) {
  let academicTitle;
  const academicTitles = [null, "", "Dr.", "Prof.", "Prof. Dr."];
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

  return academicTitle;
}

function generateFirstName(
  entityStructure: EntityStructure,
  useRealNames: boolean
) {
  let firstName;
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

  return firstName;
}

function generateLastName(
  entityStructure: EntityStructure,
  useRealNames: boolean
) {
  let lastName;
  if (useRealNames) {
    if (entityStructure === "Largest") {
      lastName = "Di-Savoia-Aosta-Carignano-Genova-Montferrat-Casa-Nuova";
    } else {
      lastName = faker.name.lastName();
    }
  } else {
    lastName = "profile";
  }
  return lastName;
}

function generatePublicFields(entityStructure: EntityStructure) {
  let publicFields;
  const alwaysPublicFields = [
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
  const privateFields = [
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

  return publicFields;
}

function generateTermsAccepted() {
  const termsAccepted = true;
  return termsAccepted;
}

function generatePosition(entityStructure: EntityStructure) {
  let position;
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

  return position;
}
