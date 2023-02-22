import { faker } from "@faker-js/faker";
import type { Award } from "@prisma/client";
import { prismaClient } from "../../../app/prisma";
import { generateProjectSlug } from "../../../app/utils";

type AwardStructure =
  | "Standard"
  | "Smallest"
  | "Largest"
  | "Empty Strings"
  | "Unicode";

type BucketData = {
  logo: {
    path: string;
  };
};

export function getAwardData(
  structure: AwardStructure,
  index: number,
  bucketData: BucketData
) {
  const awardData: Omit<Award, "id"> = {
    title: generateTitle(structure),
    date: generateDate(index),
    shortTitle: generateShortTitle(structure),
    slug: generateSlug(structure, index),
    subline: generateSubline(structure),
    logo: setLogo(bucketData),
  };
  return awardData;
}

export async function seedAward(awardData: Omit<Award, "id">) {
  const result = await prismaClient.award.create({
    data: awardData,
    select: { id: true },
  });
  return result.id;
}

function generateTitle(structure: AwardStructure) {
  let title = "";
  if (structure === "Standard") {
    title = "Best Practice Project";
  }
  if (structure === "Unicode") {
    title = "Best Practice Project_Γ";
  }
  if (structure === "Smallest") {
    title = "A-Level";
  }
  if (structure === "Largest") {
    title = "Best Practice Project In The Education Sector";
  }
  if (structure === "Empty Strings") {
    title = "";
  }
  return title;
}

function generateDate(index: number) {
  const date = new Date(2020 + index, 6);
  return date;
}

function generateShortTitle(structure: AwardStructure) {
  let shortTitle = null;
  if (structure === "Standard") {
    shortTitle = "Best Practice";
  }
  if (structure === "Unicode") {
    shortTitle = "Best Practice_Γ";
  }
  if (structure === "Smallest") {
    shortTitle = "A";
  }
  if (structure === "Largest") {
    shortTitle = "Best Practice Education";
  }
  if (structure === "Empty Strings") {
    shortTitle = "";
  }
  return shortTitle;
}

function generateSlug(structure: AwardStructure, index: number) {
  const slug = generateProjectSlug(`${structure} Award${index}`);
  return slug;
}

function generateSubline(structure: AwardStructure) {
  let subline;
  if (structure === "Empty Strings") {
    subline = "";
  } else if (structure === "Unicode") {
    subline = "A subline containing unicode character_Γ";
  } else if (structure === "Largest") {
    subline = faker.lorem.paragraphs(3);
  } else {
    subline = faker.lorem.sentence();
  }
  return subline;
}

function setLogo(bucketData: BucketData) {
  const logoPath = bucketData.logo.path;
  return logoPath;
}
