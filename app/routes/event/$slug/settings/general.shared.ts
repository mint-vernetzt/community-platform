import { format } from "date-fns";
import { array, type InferType, object, string } from "yup";
import {
  greaterThanDate,
  greaterThanTimeOnSameDate,
  multiline,
  nullOrString,
  website,
} from "~/lib/utils/yup";
import { type GeneralEventSettingsLocales } from "./general.server";

export const SUBLINE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 2000;

export const createSchema = (locales: GeneralEventSettingsLocales) => {
  return object({
    name: string().trim().required(locales.route.validation.name.required),
    startDate: string()
      .trim()
      .transform((value) => {
        const date = new Date(value);
        return format(date, "yyyy-MM-dd");
      })
      .required(locales.route.validation.startDate.required),
    startTime: string()
      .trim()
      .transform((value: string) => {
        if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          return value;
        }
        return undefined;
      })
      .required(locales.route.validation.startTime.required),
    endDate: greaterThanDate(
      "endDate",
      "startDate",
      locales.route.validation.endDate.required,
      locales.route.validation.endDate.greaterThan
    ),
    endTime: greaterThanTimeOnSameDate(
      "endTime",
      "startTime",
      "startDate",
      "endDate",
      locales.route.validation.endTime.required,
      locales.route.validation.endTime.greaterThan
    ),
    participationUntilDate: greaterThanDate(
      "participationUntilDate",
      "participationFromDate",
      locales.route.validation.participationUntilDate.required,
      locales.route.validation.participationUntilDate.greaterThan
    ),
    participationUntilTime: greaterThanTimeOnSameDate(
      "participationUntilTime",
      "participationFromTime",
      "participationUntilDate",
      "participationFromDate",
      locales.route.validation.participationUntilTime.required,
      locales.route.validation.participationUntilTime.greaterThan
    ),
    participationFromDate: greaterThanDate(
      "startDate",
      "participationFromDate",
      locales.route.validation.participationFromDate.required,
      locales.route.validation.participationFromDate.greaterThan
    ),
    participationFromTime: greaterThanTimeOnSameDate(
      "startTime",
      "participationFromTime",
      "startDate",
      "participationFromDate",
      locales.route.validation.participationFromTime.required,
      locales.route.validation.participationFromTime.greaterThan
    ),
    subline: nullOrString(multiline(SUBLINE_MAX_LENGTH)),
    description: nullOrString(multiline(DESCRIPTION_MAX_LENGTH)),
    descriptionRTEState: nullOrString(
      string()
        .trim()
        .transform((value: string | null | undefined) => {
          if (typeof value === "undefined" || value === "") {
            return null;
          }
          return value;
        })
    ),
    focuses: array(string().trim().uuid()).required(),
    eventTargetGroups: array(string().trim().uuid()).required(),
    experienceLevel: nullOrString(string().trim().uuid()),
    stage: nullOrString(string().trim().uuid()),
    types: array(string().trim().uuid()).required(),
    tags: array(string().trim().uuid()).required(),
    conferenceLink: nullOrString(website()),
    conferenceCode: nullOrString(string().trim()),
    venueName: nullOrString(string().trim()),
    venueStreet: nullOrString(string().trim()),
    venueCity: nullOrString(string().trim()),
    venueZipCode: nullOrString(string().trim()),
    submit: string().trim().required(),
    privateFields: array(string().trim().required()).required(),
  });
};

export type SchemaType = ReturnType<typeof createSchema>;
export type FormType = InferType<SchemaType>;
