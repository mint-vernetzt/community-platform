import type { ResizingType } from "imgproxy/dist/types";
import { GravityType } from "imgproxy/dist/types";
import { builder } from "./imgproxy";

type GetImageURLArguments = {
  resize?: {
    type?: ResizingType;
    width?: number;
    height?: number;
  };
  minWidth?: number;
  minHeight?: number;
  gravity?: GravityType;
  dpr?: string | number;
};

export function getImageURL(url: string, args?: GetImageURLArguments) {
  const {
    resize = {},
    gravity = GravityType.center,
    dpr = 2,
    minWidth = 0,
    minHeight = 0,
  } = args ?? {};

  // builder.setOption("min-width", `${1488}`);
  // builder.setOption("min-height", `${480}`);

  const imageURL = builder
    .resize(resize.type, resize.width, resize.height)
    .gravity(gravity)
    .dpr(dpr)
    .generateUrl(url);

  return imageURL;
}
