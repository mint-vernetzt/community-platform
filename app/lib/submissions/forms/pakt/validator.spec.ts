import { type PaktFormData } from "./paktFormData";
import { validateSubmission } from "../../validator/validateSubmission";
import * as schema from "./validation.schema.json";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

describe("pakt submission validator", () => {
  let validFormPost = {
    institution: "123", // length 3
    firstName: "Firstname",
    lastName: "Lastname",
    email: "user@domain.test", // valid email
    phone: "123456789",
    message: "",
    reachableBy: "email",
    terms_accepted: "true",
  };

  it("should not validate with missing required fields", () => {
    // @ts-ignore
    let errors = validateSubmission<PaktFormData>({}, schema);

    expect(errors).toStrictEqual([
      { field: "institution", rule: "required" },
      { field: "firstName", rule: "required" },
      { field: "lastName", rule: "required" },
      { field: "email", rule: "required" },
      { field: "phone", rule: "required" },
      { field: "reachableBy", rule: "required" },
      { field: "terms_accepted", rule: "required" },
    ]);
  });

  it("should return an error when email is invalid", () => {
    let invalidEmailAddress = {
      ...validFormPost,
      email: "invalid email",
    };

    let errors = validateSubmission<PaktFormData>(invalidEmailAddress, schema);

    expect(errors).toStrictEqual([{ field: "email", rule: "format" }]);
  });

  it("should return an error when submission contains additional properties", () => {
    let additionalProperty = {
      ...validFormPost,
      invalidProperty: "some value",
    };

    let errors = validateSubmission<PaktFormData>(additionalProperty, schema);

    expect(errors).toStrictEqual([
      { field: "invalidProperty", rule: "additionalProperties" },
    ]);
  });
});
