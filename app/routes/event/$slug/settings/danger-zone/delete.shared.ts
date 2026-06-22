import { z } from "zod";

export function createDeleteSchema(options: {
  locales: {
    validation: {
      errors: {
        eventNameMismatch: string;
      };
    };
  };
  name: string;
}) {
  const { locales, name } = options;

  const schema = z.object({
    name: z.enum([name], {
      message: locales.validation.errors.eventNameMismatch,
    }),
  });
  return schema;
}
