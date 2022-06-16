import { createHash } from "crypto";
import type { Readable } from "stream";
import type { BinaryToTextEncoding } from "crypto";

export async function createHashFromStream(
  hashAlgorithm: string,
  stream: Readable,
  encoding: BinaryToTextEncoding
) {
  const hash = createHash(hashAlgorithm);
  for await (let chunk of stream) {
    hash.update(chunk);
  }
  hash.end();
  return hash.digest(encoding);
}
