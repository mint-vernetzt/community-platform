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
  Profile: {
    Detail: {
      Background: {
        width: 1488,
        height: 480,
      },
      BlurredBackground: {
        width: 31,
        height: 10,
      },
      Avatar: {
        width: 144,
        height: 144,
      },
      BlurredAvatar: {
        width: 4,
        height: 4,
      },
    },
    Card: {
      Background: { width: 589, height: 190 },
      BlurredBackground: { width: 31, height: 10 },
      Avatar: { width: 136, height: 136 },
      BlurredAvatar: { width: 4, height: 4 },
    },
    CardFooter: {
      Avatar: { width: 36, height: 36 },
      BlurredAvatar: { width: 4, height: 4 },
    },
    ListItem: {
      Avatar: { width: 72, height: 72 },
      BlurredAvatar: { width: 4, height: 4 },
    },
    ListItemEventAndOrganizationSettings: {
      Avatar: { width: 64, height: 64 },
      BlurredAvatar: { width: 4, height: 4 },
    },
    ListItemEventDetail: {
      Avatar: { width: 44, height: 44 },
      BlurredAvatar: { width: 4, height: 4 },
    },
    ListItemProjectDetailAndSettings: {
      Avatar: { width: 40, height: 40 },
      BlurredAvatar: { width: 4, height: 4 },
    },
    NavBar: {
      Avatar: { width: 36, height: 36 },
      BlurredAvatar: { width: 4, height: 4 },
    },
  },
  Organization: {
    Detail: {
      Background: {
        width: 1488,
        height: 480,
      },
      BlurredBackground: {
        width: 31,
        height: 10,
      },
      Logo: {
        width: 160,
        height: 160,
      },
      BlurredLogo: {
        width: 4,
        height: 4,
      },
      NetworkLogo: {
        width: 40,
        height: 40,
      },
      BlurredNetworkLogo: {
        width: 4,
        height: 4,
      },
    },
    Card: {
      Background: { width: 589, height: 190 },
      BlurredBackground: { width: 31, height: 10 },
      Logo: { width: 136, height: 136 },
      BlurredLogo: { width: 4, height: 4 },
    },
    CardFooter: {
      Logo: { width: 36, height: 36 },
      BlurredLogo: { width: 4, height: 4 },
    },
    ListItem: {
      Logo: { width: 72, height: 72 },
      BlurredLogo: { width: 4, height: 4 },
    },
    ListItemEventAndOrganizationSettings: {
      Logo: { width: 64, height: 64 },
      BlurredLogo: { width: 4, height: 4 },
    },
    ListItemProfileDetail: {
      Logo: { width: 64, height: 64 },
      BlurredLogo: { width: 4, height: 4 },
    },
    ListItemCreateOrganization: {
      Logo: { width: 40, height: 40 },
      BlurredLogo: { width: 4, height: 4 },
    },
    ListItemEventDetail: {
      Logo: { width: 44, height: 44 },
      BlurredLogo: { width: 4, height: 4 },
    },
    ListItemProjectDetailAndSettings: {
      Logo: { width: 40, height: 40 },
      BlurredLogo: { width: 4, height: 4 },
    },
  },
  Event: {
    Detail: {
      Background: {
        width: 720,
        height: 480,
      },
      BlurredBackground: {
        width: 6,
        height: 4,
      },
    },
    Card: {
      Background: {
        width: 567,
        height: 378,
      },
      BlurredBackground: {
        width: 6,
        height: 4,
      },
    },
    ListItem: {
      Background: {
        width: 144,
        height: 96,
      },
      BlurredBackground: {
        width: 6,
        height: 4,
      },
    },
    ListItemEventSettings: {
      Background: {
        width: 162,
        height: 108,
      },
      BlurredBackground: {
        width: 6,
        height: 4,
      },
    },
    ListItemDashboard: {
      Background: {
        width: 165,
        height: 110,
      },
      BlurredBackground: {
        width: 6,
        height: 4,
      },
    },
  },
  Project: {
    Detail: {
      Background: {
        width: 1488,
        height: 480,
      },
      BlurredBackground: {
        width: 31,
        height: 10,
      },
      Logo: {
        width: 248,
        height: 248,
      },
      BlurredLogo: {
        width: 4,
        height: 4,
      },
      ContactLogo: {
        width: 256,
        height: 256,
      },
      BlurredContactLogo: {
        width: 4,
        height: 4,
      },
      MaterialThumbnail: {
        width: 144,
        height: 96,
      },
      BlurredMaterialThumbnail: {
        width: 6,
        height: 4,
      },
    },
    Card: {
      Background: { width: 589, height: 190 },
      BlurredBackground: { width: 31, height: 10 },
      Logo: { width: 136, height: 136 },
      BlurredLogo: { width: 4, height: 4 },
    },
    ListItem: {
      Logo: { width: 72, height: 72 },
      BlurredLogo: { width: 4, height: 4 },
    },
    ListItemProfileDetail: {
      Logo: { width: 64, height: 64 },
      BlurredLogo: { width: 4, height: 4 },
    },
  },
};

export const BlurFactor = 5;
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
