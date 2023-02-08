import { faker } from "@faker-js/faker";
import type { Project } from "@prisma/client";
import { prismaClient } from "~/prisma";
import { generateProjectSlug } from "../../../app/utils";

type ProjectStructure =
  | "Developer"
  | "Standard"
  | "Smallest"
  | "Large Team"
  | "Small Team"
  | "Empty Strings"
  | "Multiple Awarded"
  | "Many Responsible Organizations"
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

export function getProjectData(
  structure: ProjectStructure,
  index: number,
  bucketData: BucketData,
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
    if (structure === "Developer") {
      name = `0_${structure} Project`;
    } else if (structure === "Standard") {
      name = `Y_${structure} Project`;
    } else if (structure === "Unicode") {
      name = `${structure} Project_Γ`;
    } else {
      name = `${structure} Project`;
    }
  }
  return name;
}

function generateSlug(structure: ProjectStructure) {
  let slug;
  if (structure === "Developer") {
    slug = generateProjectSlug(`0_${structure} Project`);
  } else if (structure === "Standard") {
    slug = generateProjectSlug(`Y_${structure} Project`);
  } else if (structure === "Unicode") {
    slug = generateProjectSlug(`${structure} Project_Γ`);
  } else {
    slug = generateProjectSlug(`${structure} Project`);
  }
  return slug;
}

function generateHeadline(structure: ProjectStructure, useRealNames: boolean) {
  let headline;
  if (structure === "Smallest") {
    headline = null;
  } else if (structure === "Empty Strings") {
    headline = "";
  } else if (structure === "Unicode") {
    headline = "Project_Γ";
  } else if (structure === "Largest") {
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
  if (structure === "Smallest") {
    excerpt = null;
  } else if (structure === "Empty Strings") {
    excerpt = "";
  } else if (structure === "Unicode") {
    excerpt = "Project excerpt with unicode character_Γ";
  } else if (structure === "Largest") {
    excerpt = faker.lorem.paragraphs(50);
  } else {
    excerpt = faker.lorem.paragraphs(5);
  }
  return excerpt;
}

function generateDescription(structure: ProjectStructure) {
  let description;
  if (structure === "Smallest") {
    description = null;
  } else if (structure === "Empty Strings") {
    description = "";
  } else if (structure === "Unicode") {
    description = "A description containing unicode character_Γ";
  } else if (structure === "Largest") {
    description = faker.lorem.paragraphs(50);
  } else {
    description = faker.lorem.paragraphs(3);
  }
  return description;
}

function generateEmail(structure: ProjectStructure) {
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

function generatePhone(structure: ProjectStructure) {
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

function generateStreet(structure: ProjectStructure) {
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

function generateStreetNumber(structure: ProjectStructure) {
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

function generateCity(structure: ProjectStructure) {
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

function generateZipCode(structure: ProjectStructure) {
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

function generateWebsite(structure: ProjectStructure) {
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

function setLogo(structure: ProjectStructure, bucketData: BucketData) {
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

function setBackground(structure: ProjectStructure, bucketData: BucketData) {
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
    }${faker.helpers.slugify(`${entityStructure}project`)}`;
  }
  return website;
}
