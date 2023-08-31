import { Schema } from "jsonschema";

export function formMapper<T>(formData: FormData, schema: Schema): T {
  return Object.keys(schema.properties ?? {}).reduce(
    // TODO: can this type assertion be removed and proofen by code?
    (o, key) => ({ ...o, [key]: (formData.get(key) as string) ?? "" }),
    {} as T
  );
}
