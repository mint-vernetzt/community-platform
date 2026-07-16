import z from "zod";

export function createRequestConfirmationSchema(options: {
  baseUrl: string;
  locales: {
    validation: {
      email: string;
    };
  };
}) {
  const schema = z.object({
    email: z
      .string({
        message: options.locales.validation.email,
      })
      .email(options.locales.validation.email),
    eventId: z.string(),
    confirmationRedirect: z.string().startsWith(options.baseUrl),
  });
  return schema;
}
