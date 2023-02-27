import { faker } from "@faker-js/faker";
import type { Award } from "@prisma/client";
import { prismaClient } from "../../../app/prisma";
import { generateProjectSlug } from "../../../app/utils";

export type AwardStructure =
  | "standard"
  | "smallest"
  | "emptyStrings"
  | "unicode"
  | "largest";

export type AwardBucketData = {
  logo: {
    path: string;
  };
};

export function getAwardData(
  structure: AwardStructure,
  index: number,
  bucketData: AwardBucketData
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
  if (structure === "standard") {
    title = "Best Practice Project";
  }
  if (structure === "unicode") {
    title = "Best Practice Project_Γ";
  }
  if (structure === "smallest") {
    title = "A-Level";
  }
  if (structure === "largest") {
    title = "Best Practice Project In The Education Sector";
  }
  if (structure === "emptyStrings") {
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
  if (structure === "standard") {
    shortTitle = "Best Practice";
  }
  if (structure === "unicode") {
    shortTitle = "Best Practice_Γ";
  }
  if (structure === "smallest") {
    shortTitle = "A";
  }
  if (structure === "largest") {
    shortTitle = "Best Practice Education";
  }
  if (structure === "emptyStrings") {
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
  if (structure === "emptyStrings") {
    subline = "";
  } else if (structure === "unicode") {
    subline = "A subline containing unicode character_Γ";
  } else if (structure === "largest") {
    subline = faker.lorem.paragraphs(3);
  } else {
    subline = faker.lorem.sentence();
  }
  return subline;
}

function setLogo(bucketData: AwardBucketData) {
  const logoPath = bucketData.logo.path;
  return logoPath;
}
