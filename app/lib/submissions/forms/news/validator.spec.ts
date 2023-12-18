import { type NewsFormData } from "./newsFormData";
import { validateSubmission } from "../../validator/validateSubmission";
import * as schema from "./validation.schema.json";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

describe("news submission validator", () => {
  let validFormPost = {
    title: "123", // length 3
    text: "",
    source: "",
    contact_name: "",
    contact_email: "user@domain.test", // valid email
    terms_accepted: "true",
  };

  it("should not validate with missing required fields", () => {
    // @ts-ignore
    let errors = validateSubmission<NewsFormData>({}, schema);

    expect(errors).toStrictEqual([
      { field: "title", rule: "required" },
      { field: "text", rule: "required" },
      { field: "source", rule: "required" },
      { field: "contact_name", rule: "required" },
      { field: "contact_email", rule: "required" },
      { field: "terms_accepted", rule: "required" },
    ]);
  });

  it("should return an error when title is too short", () => {
    let titleTooShort = { ...validFormPost, title: "" };

    let errors = validateSubmission(titleTooShort, schema);

    expect(errors).toStrictEqual([{ field: "title", rule: "minLength" }]);
  });

  it("should return an error when email is invalid", () => {
    let invalidEmailAddress = {
      ...validFormPost,
      contact_email: "invalid email",
    };

    let errors = validateSubmission<NewsFormData>(invalidEmailAddress, schema);

    expect(errors).toStrictEqual([{ field: "contact_email", rule: "format" }]);
  });

  it("should return an error when submission contains additional properties", () => {
    let additionalProperty = {
      ...validFormPost,
      invalidProperty: "some value",
    };

    let errors = validateSubmission<NewsFormData>(additionalProperty, schema);

    expect(errors).toStrictEqual([
      { field: "invalidProperty", rule: "additionalProperties" },
    ]);
  });
});
