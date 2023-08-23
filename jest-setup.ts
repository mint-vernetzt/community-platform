import "@testing-library/jest-dom/extend-expect";
import { installGlobals } from "@remix-run/node";

installGlobals();

process.env.SUPABASE_URL = "https://supabase.test.io";
process.env.SUPABASE_ANON_KEY = "random";

//global.setImmediate = jest.useRealTimers;
global.setImmediate = (callback) => callback(); // TODO: seems to be unnecessary

jest.mock("~/prisma.server", () => {
  return { prismaClient: {} };
});

jest.mock("react-quill", () => {
  return {
    __esModule: true,
  };
});
