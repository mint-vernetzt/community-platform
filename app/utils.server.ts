import { redirect } from "@remix-run/node";
import type { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import type { BinaryToTextEncoding } from "crypto";
import { createHmac, randomBytes } from "crypto";
import { forbidden, serverError } from "remix-utils";
import { getScoreOfEntity } from "../prisma/scripts/update-score/utils";
import { getAlert, redirectWithAlert } from "./alert.server";
import { getSession } from "./auth.server";
import { prismaClient } from "./prisma.server";

export type Mode = "anon" | "authenticated";

export function deriveMode(sessionUser: User | null): Mode {
  if (sessionUser === null) {
    return "anon";
  }
  return "authenticated";
}

export async function createHashFromString(
  string: string,
  hashAlgorithm: string = "md5",
  encoding: BinaryToTextEncoding = "hex"
) {
  if (process.env.HASH_SECRET !== undefined) {
    const hash = createHmac(hashAlgorithm, process.env.HASH_SECRET);
    hash.update(string);
    return hash.digest(encoding);
  } else {
    throw serverError({
      message: "Could not find HASH_SECRET in the .env file.",
    });
  }
}

export function createCSRFToken() {
  return randomBytes(100).toString("base64");
}

// TODO: Do we need user id in combination with csrf?
export async function validateCSRFToken(
  authClient: SupabaseClient,
  request: Request
) {
  const formData = await request.clone().formData();
  const session = await getSession(authClient);

  const message = "Not allowed";

  if (session === null) {
    console.error(new Error("Session is null"));
    throw forbidden({ message });
  }

  const csrf = formData.get("csrf");

  // TODO: .has() and .get() does not exist on session since supabase v2
  // Use getSession(), refreshSession() and setSession() instead
  // https://supabase.com/docs/reference/javascript/auth-getsession
  // https://supabase.com/docs/reference/javascript/auth-refreshsession
  // https://supabase.com/docs/reference/javascript/auth-setsession

  // if (session.has("csrf") === false || csrf === null) {
  //   console.error(new Error("CSRF Token not included"));
  //   throw forbidden({ message });
  // }

  // if (csrf !== session.get("csrf")) {
  //   console.error(new Error("CSRF tokens do not match"));
  //   console.log("formData:", csrf, "session:", session.get("csrf"));
  //   throw forbidden({ message });
  // }
}

export async function addCsrfTokenToSession(authClient: SupabaseClient) {
  const session = await getSession(authClient);

  // TODO: .has() and .get() does not exist on session since supabase v2
  // Use getSession(), refreshSession() and setSession() instead
  // https://supabase.com/docs/reference/javascript/auth-getsession
  // https://supabase.com/docs/reference/javascript/auth-refreshsession
  // https://supabase.com/docs/reference/javascript/auth-setsession

  // console.log(session.get("csrf"));

  // if (session !== null) {
  //   const csrf = createCSRFToken();

  //   console.log("\n", "----add csrf to session----\n", csrf, "\n");

  //   session.set("csrf", csrf);

  //   console.log(session.get("csrf"));
  //   return csrf;
  // }

  return null;
}

export async function getFocuses() {
  const focuses = await prismaClient.focus.findMany();
  return focuses;
}

export async function getTypes() {
  const types = await prismaClient.eventType.findMany();
  return types;
}

export async function getTags() {
  const tags = await prismaClient.tag.findMany();
  return tags;
}

export async function getTargetGroups() {
  const targetGroups = await prismaClient.targetGroup.findMany();
  return targetGroups;
}

export async function getExperienceLevels() {
  const experienceLevel = await prismaClient.experienceLevel.findMany();
  return experienceLevel;
}

export async function getStages() {
  const stages = await prismaClient.stage.findMany();
  return stages;
}

export async function getAreas() {
  return await prismaClient.area.findMany({
    include: {
      state: true,
    },
  });
}

export async function getDisciplines() {
  const result = await prismaClient.discipline.findMany();
  return result;
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
    // @ts-ignore
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
export function generateValidSlug(string: string) {
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

  const timestamp = Date.now();
  const stringFromTimestamp = timestamp.toString(36);
  return `${slug}-${stringFromTimestamp}`;
}
