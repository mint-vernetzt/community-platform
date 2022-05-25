import { object, string } from "yup";

export const profileSchema = object({
  confirm: string().matches(/^wirklich löschen$/),
});
