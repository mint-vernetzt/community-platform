import { handleAuthorization, loader } from "./general";
import { getWholeProfileFromId } from "./utils.server";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

jest.mock("./general", () => {
  const originalModule = jest.requireActual("./general");
  return {
    ...originalModule,
    handleAuthorization: jest.fn(),
  };
});

jest.mock("./utils.server", () => {
  return { getWholeProfileFromId: jest.fn() };
});

const username = "sookie";

// describe("loader", () => {
//   beforeEach(() => {
//   });
test("no profile found in db", async () => {
  (handleAuthorization as jest.Mock).mockImplementationOnce(() => {
    return { id: "1" };
  });
  (getWholeProfileFromId as jest.Mock).mockImplementationOnce(() => {
    return null;
  });

  try {
    const request = new Request("/profile/sookie/settings/general", {
      method: "POST",
    });
    await loader({ request, context: {}, params: { username } });
  } catch (error) {
    console.log(error);
    // expect(error.code).toBe()
  }

  // await loader;
});
// });
