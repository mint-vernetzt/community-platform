// TODO: Update below test to suite new implementation

describe("TODO", () => {
  test("TODO", () => {});
});

// import { deleteUserByUid } from "../../../../auth.server";
// NOTE: Auth handling is now done by deriveProfileMode()
// import { handleAuthorization } from "~/app/routes/profile/$username/utils.server.ts";
// import { getProfileByUserId } from "~/profile.server";
// import { action, loader } from "./index";

// // @ts-ignore
// const expect = global.expect as jest.Expect;

// const path = "/profile/delete";

// jest.mock("~/profile.server.ts");
// jest.mock("~/app/routes/profile/$username/utils.server.ts");

// describe("context", () => {
//   beforeEach(() => {
//     jest.resetAllMocks();
//   });
//   test("call loader", async () => {
//     // NOTE: Auth handling is now done by deriveProfileMode()
//     (handleAuthorization as jest.Mock).mockReturnValue({ id: 1 });
//     (getProfileByUserId as jest.Mock).mockReturnValue({
//       firstName: "Firstname",
//       lastName: "Lastname",
//     });
//     const res = await loader({
//       request: new Request(path),
//       params: {
//         username: "firstname.lastname",
//       },
//       context: {},
//     });
//     // NOTE: Auth handling is now done by deriveProfileMode()
//     expect(handleAuthorization as jest.Mock).toBeCalledTimes(1);
//     expect(getProfileByUserId as jest.Mock).toBeCalledTimes(1);
//     expect(res).toStrictEqual({
//       profile: {
//         first
//       }
//     });
//   });

//   test("call action", async () => {
//     const formData = new FormData();
//     formData.append("username", "firstname.lastname");

//     const res = await action({
//       request: new Request(path, { method: "POST", body: formData }),
//       params: {
//         username: "firstname.lastname",
//       },
//       context: {},
//     });

//     // expect(deleteUserByUid as jest.Mock).toBeCalledTimes(1);
//     // NOTE: Auth handling is now done by deriveProfileMode()
//     expect(handleAuthorization as jest.Mock).toBeCalledTimes(1);
//     expect(res).toBeNull();
//   });
// });
