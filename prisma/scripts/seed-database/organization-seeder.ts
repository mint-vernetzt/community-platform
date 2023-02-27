import { faker } from "@faker-js/faker";
import type { Organization } from "@prisma/client";
import { prismaClient } from "~/prisma";
import { generateOrganizationSlug } from "../../../app/utils";
import { getScoreOfEntity } from "../update-score/utils";

export type OrganizationStructure =
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
  | "largest";

export type OrganizationBucketData =
  | {
      logo: {
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

export function getOrganizationData(
  structure: OrganizationStructure,
  bucketData: OrganizationBucketData,
  useRealNames: boolean
) {
  const organizationData: Omit<
    Organization,
    "id" | "updatedAt" | "createdAt" | "score"
  > = {
    name: generateName(structure, useRealNames),
    slug: generateSlug(structure),
    email: generateEmail(structure),
    phone: generatePhone(structure),
    street: generateStreet(structure),
    streetNumber: generateStreetNumber(structure),
    city: generateCity(structure),
    zipCode: generateZipCode(structure),
    website: generateWebsite(structure),
    logo: setLogo(structure, bucketData),
    background: setBackground(structure, bucketData),
    facebook: generateSocialMediaUrl(structure, "facebook"),
    linkedin: generateSocialMediaUrl(structure, "linkedin"),
    twitter: generateSocialMediaUrl(structure, "twitter"),
    xing: generateSocialMediaUrl(structure, "xing"),
    instagram: generateSocialMediaUrl(structure, "instagram"),
    youtube: generateSocialMediaUrl(structure, "youtube"),
    bio: generateBio(structure),
    quote: generateQuote(structure),
    quoteAuthor: generateQuoteAuthor(structure),
    quoteAuthorInformation: generateQuoteAuthorInformation(structure),
    supportedBy: generateSupportedBy(structure),
    publicFields: generatePublicFields(structure),
  };
  return organizationData;
}

// TODO: Add score on top level
export function addScore(
  organizationData: Omit<
    Organization,
    "id" | "updatedAt" | "createdAt" | "score"
  >
) {
  const score = getScoreOfEntity(organizationData);
  return { ...organizationData, score };
}

export async function seedOrganization(
  organizationData: Omit<Organization, "id" | "updatedAt" | "createdAt">
) {
  const result = await prismaClient.organization.create({
    data: organizationData,
    select: { id: true },
  });
  return result.id;
}

function generateName(structure: OrganizationStructure, useRealNames: boolean) {
  let name;
  if (useRealNames) {
    name = faker.company.name();
  } else {
    if (structure === "developer") {
      name = `0_${structure} Organization`;
    } else if (structure === "standard") {
      name = `Y_${structure} Organization`;
    } else if (structure === "unicode") {
      name = `${structure} Organization_Γ`;
    } else {
      name = `${structure} Organization`;
    }
  }
  return name;
}

function generateSlug(structure: OrganizationStructure) {
  let slug;
  if (structure === "developer") {
    slug = generateOrganizationSlug(`0_${structure} Organization`);
  } else if (structure === "standard") {
    slug = generateOrganizationSlug(`Y_${structure} Organization`);
  } else if (structure === "unicode") {
    slug = generateOrganizationSlug(`${structure} Organization_Γ`);
  } else {
    slug = generateOrganizationSlug(`${structure} Organization`);
  }
  return slug;
}

function generateEmail(structure: OrganizationStructure) {
  let email;
  if (structure === "smallest") {
    email = null;
  } else if (structure === "emptyStrings") {
    email = "";
  } else if (structure === "unicode") {
    email = "unicode_Γ@email.org";
  } else if (structure === "largest") {
    email = "a.very.large.email.address@LargeEmailAdresses.com";
  } else {
    email = faker.internet.email();
  }
  return email;
}

function generatePhone(structure: OrganizationStructure) {
  let phone;
  faker.locale = "de";
  if (structure === "smallest") {
    phone = null;
  } else if (structure === "emptyStrings") {
    phone = "";
  } else if (structure === "largest") {
    phone = "0123456/7891011121314151617181920";
  } else {
    phone = faker.phone.number();
  }
  faker.locale = "en";
  return phone;
}

function generateStreet(structure: OrganizationStructure) {
  let street;
  if (structure === "smallest") {
    street = null;
  } else if (structure === "emptyStrings") {
    street = "";
  } else if (structure === "unicode") {
    street = "Unicodestreet_Γ";
  } else if (structure === "largest") {
    street = "Veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeerylongstreet";
  } else {
    street = faker.address.street();
  }
  return street;
}

function generateStreetNumber(structure: OrganizationStructure) {
  let streetNumber;
  if (structure === "smallest") {
    streetNumber = null;
  } else if (structure === "emptyStrings") {
    streetNumber = "";
  } else if (structure === "largest") {
    streetNumber = faker.datatype.number({ min: 1000, max: 9999 }).toString();
  } else {
    streetNumber = faker.datatype.number({ min: 1, max: 999 }).toString();
  }
  return streetNumber;
}

function generateCity(structure: OrganizationStructure) {
  let city;
  if (structure === "smallest") {
    city = null;
  } else if (structure === "emptyStrings") {
    city = "";
  } else if (structure === "unicode") {
    city = "Unicode City_Γ";
  } else if (structure === "largest") {
    city = "The City Of The Greatest And Largest";
  } else {
    city = faker.address.cityName();
  }
  return city;
}

function generateZipCode(structure: OrganizationStructure) {
  let zipCode;
  if (structure === "smallest") {
    zipCode = null;
  } else if (structure === "emptyStrings") {
    zipCode = "";
  } else if (structure === "largest") {
    zipCode = faker.datatype
      .number({ min: 1000000000, max: 9999999999 })
      .toString();
  } else {
    zipCode = faker.address.zipCode();
  }
  return zipCode;
}

function generateWebsite(structure: OrganizationStructure) {
  let website;
  if (structure === "smallest") {
    website = null;
  } else if (structure === "emptyStrings") {
    website = "";
  } else if (structure === "unicode") {
    website = "https://unicode.website.org/Γ";
  } else if (structure === "largest") {
    website =
      "https://www.veeeeeeeeeeeeery-laaaaaaaaaaaaaaaaaaarge-website.com/with-an-enourmus-sluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuug?andsomerandom=param";
  } else {
    website = faker.internet.url();
  }
  return website;
}

function setLogo(
  structure: OrganizationStructure,
  bucketData: OrganizationBucketData
) {
  let logoPath;
  if (bucketData !== undefined) {
    if (structure === "smallest") {
      logoPath = null;
    } else {
      logoPath = bucketData.logo.path;
    }
  } else {
    logoPath = null;
  }
  return logoPath;
}

function setBackground(
  structure: OrganizationStructure,
  bucketData: OrganizationBucketData
) {
  let backgroundPath;
  if (bucketData !== undefined) {
    if (structure === "smallest") {
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
  structure: OrganizationStructure,
  socialMediaService: SocialMediaService
) {
  let website;
  let slugDifference;
  if (socialMediaService === "linkedin") {
    slugDifference = "company/";
  }
  if (socialMediaService === "xing") {
    slugDifference = "pages/";
  }
  if (structure === "smallest") {
    website = null;
  } else if (structure === "emptyStrings") {
    website = "";
  } else if (structure === "largest") {
    website = `https://www.${socialMediaService}.com/${
      slugDifference || ""
    }with-an-enourmus-sluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuug?andsomerandom=param`;
  } else if (structure === "unicode") {
    website = `https://www.${socialMediaService}.com/${
      slugDifference || ""
    }unicode-slug-Γ`;
  } else {
    website = `https://www.${socialMediaService}.com/${
      slugDifference || ""
    }${faker.helpers.slugify(`${structure}organization`)}`;
  }
  return website;
}

function generateBio(structure: OrganizationStructure) {
  let bio;
  const bioForLargest = faker.lorem.paragraphs(7).substring(0, 500);
  const bioForStandard = faker.lorem.paragraphs(1);
  if (structure === "smallest") {
    bio = null;
  } else if (structure === "emptyStrings") {
    bio = "";
  } else if (structure === "unicode") {
    bio = "A bio containing unicode character_Γ";
  } else if (structure === "largest") {
    bio = bioForLargest;
  } else {
    bio = bioForStandard;
  }
  return bio;
}

function generateQuote(structure: OrganizationStructure) {
  let quote;
  const quoteForLargest = faker.lorem.paragraphs(3).substring(0, 300);
  const quoteForStandard = faker.lorem.paragraphs(1);
  if (structure === "smallest") {
    quote = null;
  } else if (structure === "emptyStrings") {
    quote = "";
  } else if (structure === "unicode") {
    quote = "A quote containing unicode character_Γ";
  } else if (structure === "largest") {
    quote = quoteForLargest;
  } else {
    quote = quoteForStandard;
  }
  return quote;
}

function generateQuoteAuthor(structure: OrganizationStructure) {
  let quoteAuthor;
  if (structure === "smallest") {
    quoteAuthor = null;
  } else if (structure === "emptyStrings") {
    quoteAuthor = "";
  } else if (structure === "unicode") {
    quoteAuthor = "Mister Unicode_Γ";
  } else if (structure === "largest") {
    quoteAuthor =
      "Oscar Wiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiilde";
  } else {
    quoteAuthor = faker.name.fullName();
  }
  return quoteAuthor;
}

function generateQuoteAuthorInformation(structure: OrganizationStructure) {
  let quoteAuthorInformation;
  if (structure === "smallest") {
    quoteAuthorInformation = null;
  } else if (structure === "emptyStrings") {
    quoteAuthorInformation = "";
  } else if (structure === "unicode") {
    quoteAuthorInformation = "Involved in unicode business_Γ";
  } else if (structure === "largest") {
    quoteAuthorInformation =
      "A very laaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaarge job title of the author";
  } else {
    quoteAuthorInformation = faker.name.jobTitle();
  }
  return quoteAuthorInformation;
}

function generateSupportedBy(structure: OrganizationStructure) {
  let supportedBy: string[];
  if (structure === "smallest") {
    supportedBy = [];
  } else if (structure === "emptyStrings") {
    supportedBy = ["", "", ""];
  } else if (structure === "unicode") {
    supportedBy = ["Unicode company_Γ"];
  } else if (structure === "largest") {
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
  return supportedBy;
}

function generatePublicFields(structure: OrganizationStructure) {
  let publicFields;
  const alwaysPublicFields = [
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
  const privateFields = [
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
  if (structure === "public") {
    publicFields = [...alwaysPublicFields, ...privateFields];
  } else if (structure === "private") {
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
