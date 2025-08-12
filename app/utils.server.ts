import { type User } from "@supabase/supabase-js";
import type { BinaryToTextEncoding } from "crypto";
import { createHash, createHmac } from "crypto";
import sanitizeHtml from "sanitize-html";
import { getScoreOfEntity } from "../prisma/scripts/update-score/utils";
import { prismaClient } from "./prisma.server";

export type Mode = "anon" | "authenticated";

export function deriveMode(sessionUser: User | null): Mode {
  if (sessionUser === null) {
    return "anon";
  }
  return "authenticated";
}

export function createHashFromString(
  string: string,
  hashAlgorithm = "md5",
  encoding: BinaryToTextEncoding = "hex"
) {
  const hash = createHmac(hashAlgorithm, process.env.HASH_SECRET);
  hash.update(string);
  return hash.digest(encoding);
}

export function createHashFromObject(object: object) {
  const json = JSON.stringify(object);
  const hash = createHash("sha256").update(json).digest("hex");
  return hash;
}

export async function getFocuses() {
  const focuses = await prismaClient.focus.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return focuses;
}

export async function getTypes() {
  const types = await prismaClient.eventType.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return types;
}

export async function getTags() {
  const tags = await prismaClient.tag.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return tags;
}

export async function getEventTargetGroups() {
  const targetGroups = await prismaClient.eventTargetGroup.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return targetGroups;
}

export async function getExperienceLevels() {
  const experienceLevel = await prismaClient.experienceLevel.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return experienceLevel;
}

export async function getStages() {
  const stages = await prismaClient.stage.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return stages;
}

export async function getAreas() {
  return await prismaClient.area.findMany({
    include: {
      state: true,
    },
  });
}

export async function triggerEntityScore(options: {
  entity: "organization" | "profile";
  where: { id?: string; slug?: string };
}) {
  if (options.entity === "profile" && options.where.slug !== undefined) {
    return;
  }
  let entity;
  if (options.entity === "profile") {
    entity = await prismaClient.profile.findFirst({
      where: options.where,
      include: { areas: true },
    });
  } else {
    entity = await prismaClient.organization.findFirst({
      where: options.where,
      include: { areas: true, types: true },
    });
  }
  if (entity !== null) {
    const score = getScoreOfEntity(entity);
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -> Either less abstraction or runtime check
    await prismaClient[options.entity].update({
      where: { id: entity.id },
      data: { score },
    });
  }
}

export function combineHeaders(
  ...headers: Array<ResponseInit["headers"] | null>
) {
  const combined = new Headers();
  for (const header of headers) {
    if (!header) continue;
    for (const [key, value] of new Headers(header).entries()) {
      combined.append(key, value);
    }
  }
  return combined;
}

export function generateUsername(firstName: string, lastName: string) {
  return generateValidSlug(`${firstName}${lastName}`);
}

export function generateOrganizationSlug(name: string) {
  return generateValidSlug(name);
}

export function generateEventSlug(name: string) {
  return generateValidSlug(name);
}

export function generateProjectSlug(name: string) {
  return generateValidSlug(name);
}

// TODO: Use libraray (Don't know the name anymore) to convert all Unicode in a valid slug
// (Greek letters, chinese letters, arabic letters, etc...)

function defaultHashFunction(slug: string): string {
  const timestamp = Date.now();
  const stringFromTimestamp = timestamp.toString(36);
  return `${slug}-${stringFromTimestamp}`;
}

export function generateValidSlug(
  string: string,
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: { hashFunction?: (options: any) => string }
) {
  const { hashFunction = defaultHashFunction } = options || {};
  const slug = string
    .toLowerCase()
    .replace(/[áàâãå]/, "a")
    .replace(/[äæ]/, "ae")
    .replace(/[ç]/, "c")
    .replace(/[éèêë]/, "e")
    .replace(/[íìîï]/, "i")
    .replace(/[ñ]/, "n")
    .replace(/[ß]/, "ss")
    .replace(/[óòôõ]/, "o")
    .replace(/[öœø]/, "oe")
    .replace(/[úùû]/, "u")
    .replace(/[ü]/, "ue")
    .replace(/[^\w ]/g, "")
    .replace(/[\s]/g, "");

  return hashFunction(slug);
}

const allowedTags = [
  "b",
  "i",
  "em",
  "strong",
  "a",
  "ul",
  "ol",
  "p",
  "span",
  "li",
  "br",
];

const allowedAttributes = {
  a: [
    "class",
    "href",
    {
      name: "rel",
      multiple: true,
      values: ["noopener", "noreferrer"],
    },
    {
      name: "target",
      values: ["_blank"],
    },
    {
      name: "dir",
      values: ["ltr"],
    },
  ],
  b: [
    "class",
    {
      name: "data-lexical-text",
      values: ["true"],
    },
  ],
  i: [
    "class",
    {
      name: "data-lexical-text",
      values: ["true"],
    },
  ],
  em: [
    "class",
    {
      name: "data-lexical-text",
      values: ["true"],
    },
  ],
  strong: [
    "class",
    {
      name: "data-lexical-text",
      values: ["true"],
    },
  ],
  ul: ["class"],
  ol: ["class"],
  p: [
    "class",
    {
      name: "data-lexical-text",
      values: ["true"],
    },
    {
      name: "dir",
      values: ["ltr"],
    },
  ],
  span: [
    "class",
    {
      name: "data-lexical-text",
      values: ["true"],
    },
  ],
  li: [
    "class",
    {
      name: "value",
      values: [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "30",
        "31",
        "32",
        "33",
        "34",
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
        "46",
        "47",
        "48",
        "49",
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "58",
        "59",
        "60",
        "61",
        "62",
        "63",
        "64",
        "65",
        "66",
        "67",
        "68",
        "69",
        "70",
        "71",
        "72",
        "73",
        "74",
        "75",
        "76",
        "77",
        "78",
        "79",
        "80",
        "81",
        "82",
        "83",
        "84",
        "85",
        "86",
        "87",
        "88",
        "89",
        "90",
        "91",
        "92",
        "93",
        "94",
        "95",
        "96",
        "97",
        "98",
        "99",
        "100",
      ],
    },
    {
      name: "dir",
      values: ["ltr"],
    },
  ],
  br: ["class"],
};

export const sanitizeUserHtml = (
  html: string | null,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: { [key: string]: string[] };
  }
) => {
  if (html === null) {
    return null;
  }
  if (allowedTags === undefined) {
    return null;
  }
  if (allowedAttributes === undefined) {
    return null;
  }
  const sanitizedHtml = sanitizeHtml(
    html,
    options ?? {
      allowedTags,
      allowedAttributes,
    }
  ).replaceAll("<br />", "<br>");
  return sanitizedHtml;
};

export async function getCoordinatesFromAddress(options: {
  id: string;
  street: string | null;
  streetNumber: string | null;
  city: string | null;
  zipCode: string | null;
}) {
  const { id, street, streetNumber, city, zipCode } = options;
  const searchParams = new URLSearchParams();
  if (street !== null && streetNumber !== null) {
    searchParams.set("street", `${street} ${streetNumber}`);
  } else if (street !== null) {
    searchParams.set("street", street);
  }
  if (city !== null) {
    searchParams.set("city", city);
  }
  if (zipCode !== null) {
    searchParams.set("postalcode", zipCode);
  }
  if (searchParams.toString() === "") {
    return {
      longitude: null,
      latitude: null,
      error: null,
    };
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${searchParams.toString()}&format=jsonv2`,
    {
      method: "GET",
    }
  );
  if (response.status !== 200) {
    return {
      longitude: null,
      latitude: null,
      error: `Error fetching location for entity with id ${id}: ${response.statusText}`,
    };
  }

  const locationJSON = await response.json();

  if (Array.isArray(locationJSON) === false) {
    return {
      longitude: null,
      latitude: null,
      error: `Unexpected response format for entity with id ${id}: JSON object is not an array`,
    };
  }
  if (locationJSON.length === 0) {
    return {
      longitude: null,
      latitude: null,
      error: `No location found for entity with id ${id}`,
    };
  }
  if (
    "lat" in locationJSON[0] === false ||
    "lon" in locationJSON[0] === false
  ) {
    return {
      longitude: null,
      latitude: null,
      error: `Location JSON does not contain latitude and longitude for entity with id ${id}`,
    };
  }
  if (locationJSON.length > 1) {
    console.warn(
      `Multiple locations found for entity with id ${id}. The first was taken:`,
      locationJSON[0]
    );
  }
  const { lat, lon } = locationJSON[0];
  if (typeof lat !== "string" || typeof lon !== "string") {
    return {
      longitude: null,
      latitude: null,
      error: `Latitude and longitude are not strings for entity with id ${id}`,
    };
  }
  return {
    longitude: lon,
    latitude: lat,
    error: null,
  };
}
