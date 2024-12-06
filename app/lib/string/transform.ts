import crypto from "crypto";

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getHash(object: object) {
  const json = JSON.stringify(object);
  const hash = crypto.createHash("sha256").update(json).digest("hex");
  return hash;
}
