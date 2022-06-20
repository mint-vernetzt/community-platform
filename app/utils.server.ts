import { createHmac } from "crypto";
import type { BinaryToTextEncoding } from "crypto";

export async function createHashFromString(
  string: string,
  hashAlgorithm: string = "md5",
  encoding: BinaryToTextEncoding = "hex"
) {
  const hash = createHmac(hashAlgorithm, process.env.HASH_SECRET);
  hash.update(string);
  return hash.digest(encoding);
}
