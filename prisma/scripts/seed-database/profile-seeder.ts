import { faker } from "@faker-js/faker";
import type { Profile } from "@prisma/client";
import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { prismaClient } from "~/prisma";
import { generateUsername as generateUsername_app } from "../../../app/utils";
import { getScoreOfEntity } from "../update-score/utils";

type ProfileStructure =
  | "Developer"
  | "Standard"
  | "Private"
  | "Public"
  | "Smallest"
  | "Empty Strings"
  | "Event Manager"
  | "Maker"
  | "Coordinator"
  | "Unicode"
  | "Largest";

type BucketData =
  | {
      avatar: {
        path: string;
      };
      background: {
        path: string;
      };
    }
  | undefined;

type SocialMediaService =
  | "facebook"
  | "linkedin"
  | "twitter"
  | "instagram"
  | "xing"
  | "youtube";

export function getProfileData(
  structure: ProfileStructure,
  index: number,
  bucketData: BucketData,
  useRealNames: boolean
) {
  const profileData: Omit<
    Profile,
    "id" | "termsAcceptedAt" | "updatedAt" | "createdAt" | "score"
  > = {
    username: generateUsername(structure, index),
    email: generateEmail(structure, index),
    phone: generatePhone(structure),
    website: generateWebsite(structure),
    avatar: setAvatar(structure, bucketData),
    background: setBackground(structure, bucketData),
    facebook: generateSocialMediaUrl(structure, "facebook"),
    linkedin: generateSocialMediaUrl(structure, "linkedin"),
    twitter: generateSocialMediaUrl(structure, "twitter"),
    xing: generateSocialMediaUrl(structure, "xing"),
    instagram: generateSocialMediaUrl(structure, "instagram"),
    youtube: generateSocialMediaUrl(structure, "youtube"),
    bio: generateBio(structure),
    skills: generateSkills(structure),
    interests: generateInterests(structure),
    academicTitle: generateAcademicTitle(structure),
    firstName: generateFirstName(structure, useRealNames),
    lastName: generateLastName(structure, useRealNames),
    publicFields: generatePublicFields(structure),
    termsAccepted: generateTermsAccepted(),
    position: generatePosition(structure),
  };
  return profileData;
}

// TODO: Add score on top level
export function addScore(
  profileData: Omit<
    Profile,
    "id" | "termsAcceptedAt" | "updatedAt" | "createdAt" | "score"
  >
) {
  const score = getScoreOfEntity(profileData);
  return { ...profileData, score };
}

export async function seedProfile(
  profileData: Omit<
    Profile,
    "id" | "termsAcceptedAt" | "updatedAt" | "createdAt"
  >,
  authClient: SupabaseClient<any, "public", any>,
  defaultPassword: string
) {
  const { data, error } = await authClient.auth.admin.createUser({
    email: profileData.email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      username: profileData.username,
      academicTitle: profileData.academicTitle || null,
      termsAccepted: profileData.termsAccepted,
    },
  });
  if (error !== null || data === null) {
    console.error(
      `The user with the email '${profileData.email}' and the corresponding profile could not be created due to following error. ${error}`
    );
    return;
  } else {
    try {
      const result = await prismaClient.profile.update({
        where: { id: data.user.id },
        data: profileData,
        select: { id: true },
      });
      return result.id;
    } catch (e) {
      console.error(e);
      throw new Error(
        "User was created on auth.users table but not on public.profiles table. Are you sure the database trigger to create a profile on user creation is enabled? If not try to run the supabase.enhancements.sql in Supabase Studio."
      );
    }
  }
}

function generateUsername(structure: ProfileStructure, index: number) {
  let username;
  if (structure === "Developer") {
    username = generateUsername_app("0_Developer", `Profile${index}`);
  } else if (structure === "Unicode") {
    username = generateUsername_app(`${structure}_Γ`, `Profile_Γ${index}`);
  } else if (structure === "Standard") {
    username = generateUsername_app("Y_Standard", `Profile${index}`);
  } else {
    username = generateUsername_app(structure, `Profile${index}`);
  }

  return username;
}

function generateEmail(structure: ProfileStructure, index: number) {
  const email = `${structure.replace(" ", "")}@profile${index}.org`;
  return email;
}

function generatePhone(structure: ProfileStructure) {
  let phone;
  faker.locale = "de";
  if (structure === "Smallest") {
    phone = null;
  } else if (structure === "Empty Strings") {
    phone = "";
  } else if (structure === "Largest") {
    phone = "0123456/7891011121314151617181920";
  } else {
    phone = faker.phone.number();
  }
  faker.locale = "en";
  return phone;
}

function generateWebsite(structure: ProfileStructure) {
  let website;
  if (structure === "Smallest") {
    website = null;
  } else if (structure === "Empty Strings") {
    website = "";
  } else if (structure === "Unicode") {
    website = "https://unicode.website.org/Γ";
  } else if (structure === "Largest") {
    website =
      "https://www.veeeeeeeeeeeeery-laaaaaaaaaaaaaaaaaaarge-website.com/with-an-enourmus-sluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuug?andsomerandom=param";
  } else {
    website = faker.internet.url();
  }
  return website;
}

function setAvatar(structure: ProfileStructure, bucketData: BucketData) {
  let avatarPath;
  if (bucketData !== undefined) {
    if (structure === "Smallest") {
      avatarPath = null;
    } else {
      avatarPath = bucketData.avatar.path;
    }
  } else {
    avatarPath = null;
  }
  return avatarPath;
}

function setBackground(structure: ProfileStructure, bucketData: BucketData) {
  let backgroundPath;
  if (bucketData !== undefined) {
    if (structure === "Smallest") {
      backgroundPath = null;
    } else {
      backgroundPath = bucketData.background.path;
    }
  } else {
    backgroundPath = null;
  }
  return backgroundPath;
}

function generateSocialMediaUrl(
  structure: ProfileStructure,
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
  if (structure === "Smallest") {
    website = null;
  } else if (structure === "Empty Strings") {
    website = "";
  } else if (structure === "Largest") {
    website = `https://www.${socialMediaService}.com/${
      slugDifference || ""
    }with-an-enourmus-sluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuug?andsomerandom=param`;
  } else if (structure === "Unicode") {
    website = `https://www.${socialMediaService}.com/${
      slugDifference || ""
    }unicode-slug-Γ`;
  } else {
    website = `https://www.${socialMediaService}.com/${
      slugDifference || ""
    }${faker.helpers.slugify(`${structure}profile`)}`;
  }
  return website;
}

function generateBio(structure: ProfileStructure) {
  let bio;
  const bioForLargest = faker.lorem.paragraphs(7).substring(0, 500);
  const bioForStandard = faker.lorem.paragraphs(1);
  if (structure === "Smallest") {
    bio = null;
  } else if (structure === "Empty Strings") {
    bio = "";
  } else if (structure === "Unicode") {
    bio = "A bio containing unicode character_Γ";
  } else if (structure === "Largest") {
    bio = bioForLargest;
  } else {
    bio = bioForStandard;
  }

  return bio;
}

function generateSkills(structure: ProfileStructure) {
  let skills = [];
  if (structure === "Empty Strings") {
    skills = ["", "", ""];
  } else if (structure === "Unicode") {
    skills = ["Unicode skill_Γ"];
  } else if (structure === "Largest") {
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

function generateInterests(structure: ProfileStructure) {
  let interests = [];
  if (structure === "Empty Strings") {
    interests = ["", "", ""];
  } else if (structure === "Unicode") {
    interests = ["Unicode interest_Γ"];
  } else if (structure === "Largest") {
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

function generateAcademicTitle(structure: ProfileStructure) {
  let academicTitle;
  const academicTitles = [null, "", "Dr.", "Prof.", "Prof. Dr."];
  if (structure === "Smallest") {
    academicTitle = null;
  } else if (structure === "Empty Strings") {
    academicTitle = "";
  } else if (structure === "Largest") {
    academicTitle = "Prof. Dr.";
  } else {
    let index = faker.datatype.number({ min: 0, max: 4 });
    academicTitle = academicTitles[index];
  }

  return academicTitle;
}

function generateFirstName(structure: ProfileStructure, useRealNames: boolean) {
  let firstName;
  if (useRealNames) {
    if (structure === "Largest") {
      firstName = "Alexandros-Lukas-Nikolai-Ioanis-Giorgios-Petros";
    } else {
      firstName = faker.name.firstName();
    }
  } else {
    if (structure === "Developer") {
      firstName = `0_${structure}`;
    } else if (structure === "Standard") {
      firstName = `Y_${structure}`;
    } else {
      firstName = structure;
    }
  }

  return firstName;
}

function generateLastName(structure: ProfileStructure, useRealNames: boolean) {
  let lastName;
  if (useRealNames) {
    if (structure === "Largest") {
      lastName = "Di-Savoia-Aosta-Carignano-Genova-Montferrat-Casa-Nuova";
    } else {
      lastName = faker.name.lastName();
    }
  } else {
    lastName = "profile";
  }
  return lastName;
}

function generatePublicFields(structure: ProfileStructure) {
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
  if (structure === "Public") {
    publicFields = [...alwaysPublicFields, ...privateFields];
  } else if (structure === "Private") {
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

function generatePosition(structure: ProfileStructure) {
  let position;
  if (structure === "Smallest") {
    position = null;
  } else if (structure === "Empty Strings") {
    position = "";
  } else if (structure === "Unicode") {
    position = "Involved in unicode business_Γ";
  } else if (structure === "Largest") {
    position =
      "A very laaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaarge job title";
  } else {
    position = faker.name.jobTitle();
  }

  return position;
}
