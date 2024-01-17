import imgproxy from "imgproxy/dist/types.js";
// import { builder } from "./imgproxy.server";

type GetImageURLArguments = {
  resize?: {
    type?: imgproxy.ResizingType;
    width?: number;
    height?: number;
    enlarge?: boolean;
  };
  gravity?: imgproxy.Gravity;
  dpr?: number;
  blur?: number;
};

export function getImageURL(url: string, args?: GetImageURLArguments) {
  const {
    resize = {},
    gravity = imgproxy.GravityType.center,
    dpr = 2,
    blur = 0,
  } = args ?? {};

  // const imageURL = builder
  //   .resize(resize.type, resize.width, resize.height, resize.enlarge)
  //   .gravity(gravity)
  //   .dpr(dpr)
  //   .blur(blur)
  //   .generateUrl(url);

  // return imageURL;
  return "";
}
