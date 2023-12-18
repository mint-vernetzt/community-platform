import type { ResizingType } from "imgproxy/dist/types";
import { GravityType } from "imgproxy/dist/types";
import { builder } from "./imgproxy.server";

type GetImageURLArguments = {
  resize?: {
    type?: ResizingType;
    width?: number;
    height?: number;
    enlarge?: boolean;
  };
  gravity?: GravityType;
  dpr?: number;
  blur?: number;
};

export function getImageURL(url: string, args?: GetImageURLArguments) {
  const {
    resize = {},
    gravity = GravityType.center,
    dpr = 2,
    blur = 0,
  } = args ?? {};

  const imageURL = builder
    .resize(resize.type, resize.width, resize.height, resize.enlarge)
    .gravity(gravity)
    .dpr(dpr)
    .blur(blur)
    .generateUrl(url);

  return imageURL;
}
