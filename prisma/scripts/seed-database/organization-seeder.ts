import { faker } from "@faker-js/faker";
import type { Organization } from "@prisma/client";
import { prismaClient } from "~/prisma";
import { generateOrganizationSlug } from "../../../app/utils";
import { getScoreOfEntity } from "../update-score/utils";

type OrganizationStructure =
  | "Developer"
  | "Standard"
  | "Large Team"
  | "Small Team"
  | "Event Companion"
  | "Project Companion"
  | "Network"
  | "Coordinator"
  | "Private"
  | "Public"
  | "Smallest"
  | "Empty Strings"
  | "Unicode"
  | "Largest";

type BucketData =
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
  bucketData: BucketData,
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
    if (structure === "Developer") {
      name = `0_${structure} Organization`;
    } else if (structure === "Standard") {
      name = `Y_${structure} Organization`;
    } else if (structure === "Unicode") {
      name = `${structure} Organization_Γ`;
    } else {
      name = `${structure} Organization`;
    }
  }
  return name;
}

function generateSlug(structure: OrganizationStructure) {
  let slug;
  if (structure === "Developer") {
    slug = generateOrganizationSlug(`0_${structure} Organization`);
  } else if (structure === "Standard") {
    slug = generateOrganizationSlug(`Y_${structure} Organization`);
  } else if (structure === "Unicode") {
    slug = generateOrganizationSlug(`${structure} Organization_Γ`);
  } else {
    slug = generateOrganizationSlug(`${structure} Organization`);
  }
  return slug;
}

function generateEmail(structure: OrganizationStructure) {
  let email;
  if (structure === "Smallest") {
    email = null;
  } else if (structure === "Empty Strings") {
    email = "";
  } else if (structure === "Unicode") {
    email = "unicode_Γ@email.org";
  } else if (structure === "Largest") {
    email = "a.very.large.email.address@LargeEmailAdresses.com";
  } else {
    email = faker.internet.email();
  }
  return email;
}

function generatePhone(structure: OrganizationStructure) {
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

function generateStreet(structure: OrganizationStructure) {
  let street;
  if (structure === "Smallest") {
    street = null;
  } else if (structure === "Empty Strings") {
    street = "";
  } else if (structure === "Unicode") {
    street = "Unicodestreet_Γ";
  } else if (structure === "Largest") {
    street = "Veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeerylongstreet";
  } else {
    street = faker.address.street();
  }
  return street;
}

function generateStreetNumber(structure: OrganizationStructure) {
  let streetNumber;
  if (structure === "Smallest") {
    streetNumber = null;
  } else if (structure === "Empty Strings") {
    streetNumber = "";
  } else if (structure === "Largest") {
    streetNumber = faker.datatype.number({ min: 1000, max: 9999 }).toString();
  } else {
    streetNumber = faker.datatype.number({ min: 1, max: 999 }).toString();
  }
  return streetNumber;
}

function generateCity(structure: OrganizationStructure) {
  let city;
  if (structure === "Smallest") {
    city = null;
  } else if (structure === "Empty Strings") {
    city = "";
  } else if (structure === "Unicode") {
    city = "Unicode City_Γ";
  } else if (structure === "Largest") {
    city = "The City Of The Greatest And Largest";
  } else {
    city = faker.address.cityName();
  }
  return city;
}

function generateZipCode(structure: OrganizationStructure) {
  let zipCode;
  if (structure === "Smallest") {
    zipCode = null;
  } else if (structure === "Empty Strings") {
    zipCode = "";
  } else if (structure === "Largest") {
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

function setLogo(structure: OrganizationStructure, bucketData: BucketData) {
  let logoPath;
  if (bucketData !== undefined) {
    if (structure === "Smallest") {
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
  bucketData: BucketData
) {
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
    }${faker.helpers.slugify(`${structure}organization`)}`;
  }
  return website;
}

function generateBio(structure: OrganizationStructure) {
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

function generateQuote(structure: OrganizationStructure) {
  let quote;
  const quoteForLargest = faker.lorem.paragraphs(3).substring(0, 300);
  const quoteForStandard = faker.lorem.paragraphs(1);
  if (structure === "Smallest") {
    quote = null;
  } else if (structure === "Empty Strings") {
    quote = "";
  } else if (structure === "Unicode") {
    quote = "A quote containing unicode character_Γ";
  } else if (structure === "Largest") {
    quote = quoteForLargest;
  } else {
    quote = quoteForStandard;
  }
  return quote;
}

function generateQuoteAuthor(structure: OrganizationStructure) {
  let quoteAuthor;
  if (structure === "Smallest") {
    quoteAuthor = null;
  } else if (structure === "Empty Strings") {
    quoteAuthor = "";
  } else if (structure === "Unicode") {
    quoteAuthor = "Mister Unicode_Γ";
  } else if (structure === "Largest") {
    quoteAuthor =
      "Oscar Wiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiilde";
  } else {
    quoteAuthor = faker.name.fullName();
  }
  return quoteAuthor;
}

function generateQuoteAuthorInformation(structure: OrganizationStructure) {
  let quoteAuthorInformation;
  if (structure === "Smallest") {
    quoteAuthorInformation = null;
  } else if (structure === "Empty Strings") {
    quoteAuthorInformation = "";
  } else if (structure === "Unicode") {
    quoteAuthorInformation = "Involved in unicode business_Γ";
  } else if (structure === "Largest") {
    quoteAuthorInformation =
      "A very laaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaarge job title of the author";
  } else {
    quoteAuthorInformation = faker.name.jobTitle();
  }
  return quoteAuthorInformation;
}

function generateSupportedBy(structure: OrganizationStructure) {
  let supportedBy: string[];
  if (structure === "Smallest") {
    supportedBy = [];
  } else if (structure === "Empty Strings") {
    supportedBy = ["", "", ""];
  } else if (structure === "Unicode") {
    supportedBy = ["Unicode company_Γ"];
  } else if (structure === "Largest") {
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
