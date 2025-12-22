import { z } from "zod";

export function createChangeURLSchema(options: {
  locales: {
    validation: {
      slug: {
        minLength: string;
        maxLength: string;
        pattern: string;
      };
    };
  };
}) {
  const { locales } = options;

  const schema = z.object({
    slug: z
      .string({ required_error: locales.validation.slug.pattern })
      .min(3, { message: locales.validation.slug.minLength })
      .max(50, { message: locales.validation.slug.maxLength })
      .regex(/^[a-z0-9-_]+$/, { message: locales.validation.slug.pattern }),
  });
  return schema;
}
