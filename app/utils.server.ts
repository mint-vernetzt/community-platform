import { createHmac, randomBytes } from "crypto";
import type { BinaryToTextEncoding } from "crypto";
import { getSession } from "./auth.server";
import { forbidden } from "remix-utils";
import { json } from "body-parser";

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
    throw forbidden({ message });
  }
}
