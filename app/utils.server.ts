import type { BinaryToTextEncoding } from "crypto";
import { getSession } from "./auth.server";
import { forbidden } from "remix-utils";
import { createHmac, randomBytes } from "crypto";
import { prismaClient } from "./prisma";
import type { Readable } from "stream";

export async function stream2buffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf: Array<Uint8Array> = [];
    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(`error converting stream - ${err}`));
  });
}

export async function createHashFromString(
  string: string,
  hashAlgorithm: string = "md5",
  encoding: BinaryToTextEncoding = "hex"
) {
  const hash = createHmac(hashAlgorithm, process.env.HASH_SECRET);
  hash.update(string);
  return hash.digest(encoding);
}

export function createCSRFToken() {
  return randomBytes(100).toString("base64");
}

export async function validateCSRFToken(request: Request) {
  const formData = await request.clone().formData();
  const session = await getSession(request);

  const message = "Not allowed";

  if (session === null) {
    console.error(new Error("Session is null"));
    throw forbidden({ message });
  }

  const csrf = formData.get("csrf");

  if (session.has("csrf") === false || csrf === null) {
    console.error(new Error("CSRF Token not included"));
    throw forbidden({ message });
  }

  if (csrf !== session.get("csrf")) {
    console.error(new Error("CSRF tokens do not match"));
    console.log("formData:", csrf, "session:", session.get("csrf"));
    throw forbidden({ message });
  }
}

export async function addCsrfTokenToSession(request: Request) {
  const session = await getSession(request);

  console.log(session.get("csrf"));

  if (session !== null) {
    const csrf = createCSRFToken();

    console.log("\n", "----add csrf to session----\n", csrf, "\n");

    session.set("csrf", csrf);

    console.log(session.get("csrf"));
    return csrf;
  }

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

export async function getAreas() {
  return await prismaClient.area.findMany({
    include: {
      state: true,
    },
  });
}
