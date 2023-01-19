import type { BinaryToTextEncoding } from "crypto";
import { getSession } from "./auth.server";
import { forbidden, serverError } from "remix-utils";
import { createHmac, randomBytes } from "crypto";
import { prismaClient } from "./prisma";
import type { SupabaseClient } from "@supabase/auth-helpers-remix";

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
