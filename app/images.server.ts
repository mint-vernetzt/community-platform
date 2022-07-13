import { GravityType, ResizingType } from "imgproxy/dist/types";
import { builder } from "./imgproxy";

type GetImageURLArguments = {
  resize?: {
    type?: ResizingType;
    width?: number;
    height?: number;
  };
  gravity?: GravityType;
  dpr?: string | number;
};

export function getImageURL(url: string, args?: GetImageURLArguments) {
  const { resize = {}, gravity = GravityType.center, dpr = 2 } = args ?? {};

  const imageURL = builder
    .resize(resize.type, resize.width, resize.height)
    .gravity(gravity)
    .dpr(dpr)
    .generateUrl(url);

  return imageURL;
}
