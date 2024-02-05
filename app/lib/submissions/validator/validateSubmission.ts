import type { Schema } from "jsonschema";
import { Validator } from "jsonschema";

export function validateSubmission<T>(formData: T, schema: Schema) {
  const validator = new Validator();
  const result = validator.validate(formData, schema);

  return result.errors.map((e) => ({
    field:
      e.property === "instance" ? e.argument : e.property.split(".")[1] ?? "",
    rule: e.name,
  }));
}
