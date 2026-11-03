import { z } from "zod";
import { type RequestConfirmationLocales } from "./request-confirmation.server";

export const createRequestConfirmationSchema = (
  locales: RequestConfirmationLocales
) => {
  return z.object({
    type: z.enum(["signup", "email_change", "recovery"]),
    email: z.email(locales.validation.email),
    loginRedirect: z.string().optional(),
  });
};
