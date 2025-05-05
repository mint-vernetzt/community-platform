import { type User } from "@supabase/supabase-js";
import type { BinaryToTextEncoding } from "crypto";
import { createHmac, createHash } from "crypto";
import { getScoreOfEntity } from "../prisma/scripts/update-score/utils";
import { prismaClient } from "./prisma.server";
import sanitizeHtml from "sanitize-html";

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
  a: ["href", "rel", "target", "class", "dir"],
  b: ["class", "data-lexical-text"],
  i: ["class", "data-lexical-text"],
  em: ["class", "data-lexical-text"],
  strong: ["class", "data-lexical-text"],
  ul: ["class"],
  ol: ["class"],
  p: ["dir", "class", "data-lexical-text"],
  span: ["class", "data-lexical-text"],
  li: ["class", "value", "dir"],
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
  return sanitizeHtml(
    html,
    options ?? {
      allowedTags,
      allowedAttributes,
      parseStyleAttributes: true,
    }
  );
};
