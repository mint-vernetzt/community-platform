import z from "zod";

export const SUBMIT_REGISTRATION_TYPE_ACTION = "type";
export const INTERNAL_REGISTRATION = "internal";
export const EXTERNAL_REGISTRATION = "external";
export const SUBMIT_REGISTRATION_ACCESS_ACTION = "access";
export const OPEN_REGISTRATION = "open";
export const CLOSED_REGISTRATION = "closed";

export function createAccessSettingsSchema() {
  const schema = z.object({
    type: z.enum([INTERNAL_REGISTRATION, EXTERNAL_REGISTRATION]).optional(),
    access: z.enum([OPEN_REGISTRATION, CLOSED_REGISTRATION]).optional(),
  });
  return schema;
}
