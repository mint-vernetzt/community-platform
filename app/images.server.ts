import crypto from "crypto";

export type ResizeType = "fit" | "fill" | "crop";

export const GravityType = {
  center: "ce",
  north: "no",
  south: "so",
  east: "ea",
  west: "we",
  northEast: "noea",
  northWest: "nowe",
  southEast: "soea",
  southWest: "sowe",
  smart: "sm",
};

const baseUrl = process.env.IMGPROXY_URL;
const key = process.env.IMGPROXY_KEY;
const salt = process.env.IMGPROXY_SALT;

function encode(str: string) {
  const encodedString = Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\//g, "_")
    .replace(/\+/g, "-");

  return encodedString;
}

function serialize(obj: { [key: string]: string }) {
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return "";
  }

  return keys
    .map((key) => {
      return `${key}:${obj[key]}`;
    })
    .join("/");
}

export function getImageURL(
  url: string,
  options?: {
    resize?: {
      type?: ResizeType;
      width?: number;
      height?: number;
      enlarge?: boolean;
    };
    gravity?: string;
    dpr?: number;
    blur?: number;
  }
) {
  if (
    typeof baseUrl === "undefined" ||
    typeof key === "undefined" ||
    typeof salt === "undefined"
  ) {
    throw new Error("imgproxy environment variables are not set");
  }

  const { resize, gravity = "ce", dpr = 2, blur = 0 } = options || {};

  const imgOptions: { [key: string]: string } = {};

  if (typeof dpr === "number" && dpr > 0) {
    imgOptions.dpr = dpr.toString();
  }

  if (typeof blur === "number" && blur > 0) {
    imgOptions.blur = blur.toString();
  }

  imgOptions.gravity = gravity;

  // create resize part of the url
  if (typeof resize !== "undefined") {
    imgOptions.resize = [
      resize.type,
      resize.width,
      resize.height,
      resize.enlarge ? 1 : 0,
    ].join(":");
  }

  const serializedOptions = serialize(imgOptions); // {key: "value"} --> "/key:value"
  const uri = encode(url);

  const hmac = crypto.createHmac("sha256", Buffer.from(key, "hex"));
  hmac.update(Buffer.from(salt, "hex"));
  hmac.update(Buffer.from(uri));

  const signature = encode(hmac.digest("hex").slice(0, 32));

  const imgUrl = new URL(`${signature}/${serializedOptions}/${uri}`, baseUrl);

  return imgUrl.toString();
}
