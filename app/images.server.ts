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

export const ImageSizes = {
  Event: {
    ListItem: {
      width: 144,
      height: 96,
    },
    NotificationListItem: {
      width: 164,
      height: 124,
    },
  },
  Project: {
    ListItem: {
      Logo: {
        width: 136,
        height: 136,
      },
      BlurredLogo: {
        width: 17,
        height: 17,
      },
      Background: {
        width: 348,
        height: 160,
      },
      BlurredBackground: {
        width: 87, // TODO: make this smaller (must be an integer)
        height: 40, // TODO: make this smaller (must be an integer)
      },
      ResponsibleOrganizationLogo: {
        width: 64,
        height: 64,
      },
    },
  },
};

export const BlurredBackgroundScale = 0.0625;
export const DefaultImages = {
  Event: {
    Background: "/images/default-event-background.jpg",
    BlurredBackground: "/images/default-event-background-blurred.jpg",
  },
  Project: {
    Background: "/images/default-project-background.jpg",
    BlurredBackground: "/images/default-project-background-blurred.jpg",
  },
};

function encodeUrlCharacters(url: string) {
  const encodedUrl = url
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return encodedUrl;
}

function encodeUrl(data: Buffer | string) {
  if (Buffer.isBuffer(data)) {
    return encodeUrlCharacters(data.toString("base64"));
  }
  return encodeUrlCharacters(Buffer.from(data, "utf-8").toString("base64"));
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

  // create resize part of the url
  const { type, width, height, enlarge = true } = resize || {};
  if (typeof resize !== "undefined") {
    imgOptions.rs = [type, width, height, enlarge ? 1 : 0].join(":");
  }

  imgOptions.g = gravity;
  imgOptions.dpr = dpr.toString();
  imgOptions.bl = blur.toString();

  const serializedOptions = serialize(imgOptions); // {key: "value"} --> "/key:value"
  const uri = `/${serializedOptions}/${encodeUrl(url)}`;

  const hmac = crypto.createHmac("sha256", Buffer.from(key, "hex"));
  hmac.update(Buffer.from(salt, "hex"));
  hmac.update(Buffer.from(uri));

  const signature = encodeUrl(hmac.digest().subarray(0, 32));

  const imgUrl = new URL(`${signature}${uri}`, baseUrl);

  return imgUrl.toString();
}
