import "@testing-library/jest-dom/extend-expect";

import { installGlobals } from "@remix-run/node";
installGlobals();

//global.setImmediate = jest.useRealTimers;
global.setImmediate = (callback) => callback();

jest.mock("~/prisma", () => {
  return { prismaClient: {} };
});
