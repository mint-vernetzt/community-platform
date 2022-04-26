import { EventFormData } from "./eventFormData";
import { validateSubmission } from "../../validator/validateSubmission";
import * as schema from "./validation.schema.json";
describe("event submission validator", () => {
  let validFormPost = {
    name: "123", // length 3
    place: "", // length 3
    description: "",
    date: "1974-03-18",
    contact_name: "",
    contact_email: "user@domain.test", // valid email
    terms_accepted: "true",
  };

  it("should not validate with missing required fields", () => {
    // @ts-ignore
    let errors = validateSubmission<EventFormData>({}, schema);

    expect(errors).toStrictEqual([
      { field: "name", rule: "required" },
      { field: "place", rule: "required" },
      { field: "date", rule: "required" },
      { field: "description", rule: "required" },
      { field: "contact_name", rule: "required" },
      { field: "contact_email", rule: "required" },
      { field: "terms_accepted", rule: "required" },
    ]);
  });

  it("should return an error when name is too short", () => {
    let titleTooShort = { ...validFormPost, name: "" };

    let errors = validateSubmission(titleTooShort, schema);

    expect(errors).toStrictEqual([{ field: "name", rule: "minLength" }]);
  });

  it("should return an error when email is invalid", () => {
    let invalidEmailAddress = {
      ...validFormPost,
      contact_email: "invalid email",
    };

    let errors = validateSubmission<EventFormData>(invalidEmailAddress, schema);

    expect(errors).toStrictEqual([{ field: "contact_email", rule: "format" }]);
  });

  it("should return an error when submission contains additional properties", () => {
    let additionalProperty = {
      ...validFormPost,
      invalidProperty: "some value",
    };

    let errors = validateSubmission<EventFormData>(additionalProperty, schema);

    expect(errors).toStrictEqual([
      { field: "invalidProperty", rule: "additionalProperties" },
    ]);
  });

  test("date is empty", () => {
    let additionalProperty = {
      ...validFormPost,
      date: "",
    };

    let errors = validateSubmission<EventFormData>(additionalProperty, schema);
    expect(errors).toStrictEqual([{ field: "date", rule: "format" }]);
  });

  test("date is in wrong format", () => {
    let additionalProperty = {
      ...validFormPost,
      date: "18.03.1974",
    };

    let errors = validateSubmission<EventFormData>(additionalProperty, schema);
    expect(errors).toStrictEqual([{ field: "date", rule: "format" }]);
  });
});
