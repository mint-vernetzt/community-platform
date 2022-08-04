import { loader } from "./general";
import { getWholeProfileFromId, handleAuthorization } from "./utils.server";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

jest.mock("./utils.server", () => {
  return { getWholeProfileFromId: jest.fn(), handleAuthorization: jest.fn() };
});

jest.mock("~/profile.server", () => {
  return { getAllOffers: jest.fn(), getAreas: jest.fn() };
});

const username = "sookie";
const id = "1";

describe("loader", () => {
  beforeEach(() => {
    (handleAuthorization as jest.Mock).mockImplementation(() => {
      return { id };
    });
  });
  test("no profile found in db", async () => {
    (getWholeProfileFromId as jest.Mock).mockImplementationOnce(() => {
      return null;
    });

    expect.assertions(2);

    try {
      const request = new Request("");
      await loader({ request, context: {}, params: { username } });
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.message).toBe("Profile not found");
    }
  });
  test("profile found", async () => {
    const profile = { id, areas: [], offers: [], seekings: [] };

    (getWholeProfileFromId as jest.Mock).mockReturnValueOnce(profile);

    const request = new Request("");
    const response = await loader({
      request,
      context: {},
      params: { username },
    });

    expect(response.profile).toEqual(profile);
  });
  test("flatten areas, offers and seekings", async () => {
    (getWholeProfileFromId as jest.Mock).mockReturnValueOnce({
      id,
      areas: [{ area: { id: "area1" } }, { area: { id: "area2" } }],
      offers: [{ offer: { id: "offer1" } }],
      seekings: [
        { offer: { id: "offer1" } },
        { offer: { id: "offer2" } },
        { offer: { id: "offer3" } },
      ],
    });

    const request = new Request("");
    const response = await loader({
      request,
      context: {},
      params: { username },
    });

    expect(response.profile.areas).toEqual(["area1", "area2"]);
    expect(response.profile.offers).toEqual(["offer1"]);
    expect(response.profile.seekings).toEqual(["offer1", "offer2", "offer3"]);
  });
});
