import { faker } from "@faker-js/faker";
import type { Project } from "@prisma/client";
import { prismaClient } from "~/prisma";
import { generateProjectSlug } from "../../../app/utils";

export type ProjectStructure =
  | "developer"
  | "standard"
  | "largeTeam"
  | "smallTeam"
  | "multipleAwarded"
  | "manyResponsibleOrganizations"
  | "smallest"
  | "emptyStrings"
  | "unicode"
  | "largest";

export type ProjectBucketData =
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

export function getProjectData(
  structure: ProjectStructure,
  bucketData: ProjectBucketData,
  useRealNames: boolean
) {
  const projectData: Omit<Project, "id" | "updatedAt" | "createdAt"> = {
    name: generateName(structure, useRealNames),
    slug: generateSlug(structure),
    headline: generateHeadline(structure, useRealNames),
    excerpt: generateExcerpt(structure),
    description: generateDescription(structure),
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
  };
  return projectData;
}

export async function seedProject(
  projectData: Omit<Project, "id" | "updatedAt" | "createdAt">
) {
  const result = await prismaClient.project.create({
    data: projectData,
    select: { id: true },
  });
  return result.id;
}

function generateName(structure: ProjectStructure, useRealNames: boolean) {
  let name;
  if (useRealNames) {
    name = faker.commerce.productName();
  } else {
    if (structure === "developer") {
      name = `0_${structure} Project`;
    } else if (structure === "standard") {
      name = `Y_${structure} Project`;
    } else if (structure === "unicode") {
      name = `${structure} Project_Γ`;
    } else {
      name = `${structure} Project`;
    }
  }
  return name;
}

function generateSlug(structure: ProjectStructure) {
  let slug;
  if (structure === "developer") {
    slug = generateProjectSlug(`0_${structure} Project`);
  } else if (structure === "standard") {
    slug = generateProjectSlug(`Y_${structure} Project`);
  } else if (structure === "unicode") {
    slug = generateProjectSlug(`${structure} Project_Γ`);
  } else {
    slug = generateProjectSlug(`${structure} Project`);
  }
  return slug;
}

function generateHeadline(structure: ProjectStructure, useRealNames: boolean) {
  let headline;
  if (structure === "smallest") {
    headline = null;
  } else if (structure === "emptyStrings") {
    headline = "";
  } else if (structure === "unicode") {
    headline = "Project_Γ";
  } else if (structure === "largest") {
    headline =
      "Very long project headline - This project headline was created by cn and not by faker - And it gets even longer - Ohhhhhhhhh it is very long, indeed";
  } else {
    if (useRealNames) {
      headline = faker.commerce.productName();
    } else {
      headline = `${structure} Project`;
    }
  }
  return headline;
}

function generateExcerpt(structure: ProjectStructure) {
  let excerpt;
  if (structure === "smallest") {
    excerpt = null;
  } else if (structure === "emptyStrings") {
    excerpt = "";
  } else if (structure === "unicode") {
    excerpt = "Project excerpt with unicode character_Γ";
  } else if (structure === "largest") {
    excerpt = faker.lorem.paragraphs(50);
  } else {
    excerpt = faker.lorem.paragraphs(5);
  }
  return excerpt;
}

function generateDescription(structure: ProjectStructure) {
  let description;
  if (structure === "smallest") {
    description = null;
  } else if (structure === "emptyStrings") {
    description = "";
  } else if (structure === "unicode") {
    description = "A description containing unicode character_Γ";
  } else if (structure === "largest") {
    description = faker.lorem.paragraphs(50);
  } else {
    description = faker.lorem.paragraphs(3);
  }
  return description;
}

function generateEmail(structure: ProjectStructure) {
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

function generatePhone(structure: ProjectStructure) {
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

function generateStreet(structure: ProjectStructure) {
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

function generateStreetNumber(structure: ProjectStructure) {
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

function generateCity(structure: ProjectStructure) {
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

function generateZipCode(structure: ProjectStructure) {
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

function generateWebsite(structure: ProjectStructure) {
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

function setLogo(structure: ProjectStructure, bucketData: ProjectBucketData) {
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
  structure: ProjectStructure,
  bucketData: ProjectBucketData
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
  entityStructure: ProjectStructure,
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
  if (entityStructure === "smallest") {
    website = null;
  } else if (entityStructure === "emptyStrings") {
    website = "";
  } else if (entityStructure === "largest") {
    website = `https://www.${socialMediaService}.com/${
      slugDifference || ""
    }with-an-enourmus-sluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuug?andsomerandom=param`;
  } else if (entityStructure === "unicode") {
    website = `https://www.${socialMediaService}.com/${
      slugDifference || ""
    }unicode-slug-Γ`;
  } else {
    website = `https://www.${socialMediaService}.com/${
      slugDifference || ""
    }${faker.helpers.slugify(`${entityStructure}project`)}`;
  }
  return website;
}
