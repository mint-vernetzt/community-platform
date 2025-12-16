import { type InferType, object, string } from "yup";
import { type CreateEventLocales } from "./create.server";
import { format } from "date-fns-tz";
import {
  greaterThanDate,
  greaterThanTimeOnSameDate,
  nullOrString,
} from "~/lib/utils/yup";

export const createSchema = (locales: CreateEventLocales) => {
  return object({
    name: string().trim().required(locales.validation.name.required),
    startDate: string()
      .trim()
      .transform((value) => {
        const date = new Date(value);
        return format(date, "yyyy-MM-dd");
      })
      .required(locales.validation.startDate.required),
    startTime: string().trim().required(locales.validation.startTime.required),
    endDate: greaterThanDate(
      "endDate",
      "startDate",
      locales.validation.endDate.required,
      locales.validation.endDate.greaterThan
    ),
    endTime: greaterThanTimeOnSameDate(
      "endTime",
      "startTime",
      "startDate",
      "endDate",
      locales.validation.endTime.required,
      locales.validation.endTime.greaterThan
    ),
    child: nullOrString(string().trim()),
    parent: nullOrString(string().trim()),
  });
};

export type SchemaType = ReturnType<typeof createSchema>;
export type FormType = InferType<SchemaType>;
