import "@testing-library/jest-dom/extend-expect";
import { installGlobals } from "@remix-run/node";

installGlobals();

//global.setImmediate = jest.useRealTimers;
global.setImmediate = (callback) => callback(); // TODO: seems to be unnecessary

jest.mock("~/prisma", () => {
  return { prismaClient: {} };
});
