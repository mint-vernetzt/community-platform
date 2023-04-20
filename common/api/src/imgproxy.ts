import Imgproxy from "imgproxy";

declare global {
  var __imgproxy: Imgproxy | undefined;
}

let imgproxy: Imgproxy;

if (process.env.NODE_ENV === "production") {
  imgproxy = new Imgproxy({
    baseUrl: process.env.IMGPROXY_URL || "",
    key: process.env.IMGPROXY_KEY || "",
    salt: process.env.IMGPROXY_SALT || "",
    encode: true,
  });
} else {
  if (global.__imgproxy === undefined) {
    global.__imgproxy = new Imgproxy({
      baseUrl: process.env.IMGPROXY_URL || "",
      key: process.env.IMGPROXY_KEY || "",
      salt: process.env.IMGPROXY_SALT || "",
      encode: true,
    });
  }
  imgproxy = global.__imgproxy;
}

const builder = imgproxy.builder();

export { builder };
