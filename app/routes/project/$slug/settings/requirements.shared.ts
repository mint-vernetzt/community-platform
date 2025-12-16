import { z } from "zod";
import { type ProjectRequirementsSettingsLocales } from "./requirements.server";
import { removeHtmlTags, replaceHtmlEntities } from "~/lib/utils/transformHtml";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export const TIMEFRAME_MAX_LENGTH = 200;
export const JOB_FILLINGS_MAX_LENGTH = 800;
export const FURTHER_JOB_FILLINGS_MAX_LENGTH = 200;
export const YEARLY_BUDGET_MAX_LENGTH = 80;
export const FURTHER_FINANCINGS_MAX_LENGTH = 800;
export const TECHNICAL_REQUIREMENTS_MAX_LENGTH = 500;
export const FURTHER_TECHNICAL_REQUIREMENTS_MAX_LENGTH = 500;
export const ROOM_SITUATION_MAX_LENGTH = 200;
export const FURTHER_ROOM_SITUATION_MAX_LENGTH = 200;

export const createRequirementsSchema = (
  locales: ProjectRequirementsSettingsLocales
) =>
  z.object({
    timeframe: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            TIMEFRAME_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.timeframe.length,
            { max: TIMEFRAME_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    timeframeRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    jobFillings: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            JOB_FILLINGS_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.jobFillings.length,
            { max: JOB_FILLINGS_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    jobFillingsRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    furtherJobFillings: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            FURTHER_JOB_FILLINGS_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.furtherJobFillings.length,
            { max: FURTHER_JOB_FILLINGS_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    furtherJobFillingsRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    yearlyBudget: z
      .string()
      .trim()
      .max(
        YEARLY_BUDGET_MAX_LENGTH,
        insertParametersIntoLocale(locales.route.validation.yearlyBudget.max, {
          max: YEARLY_BUDGET_MAX_LENGTH,
        })
      )
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    financings: z.array(z.string().trim().uuid()),
    furtherFinancings: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            FURTHER_FINANCINGS_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.furtherFinancings.length,
            { max: FURTHER_FINANCINGS_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    furtherFinancingsRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    technicalRequirements: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            TECHNICAL_REQUIREMENTS_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.technicalRequirements.length,
            { max: TECHNICAL_REQUIREMENTS_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    technicalRequirementsRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    furtherTechnicalRequirements: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            FURTHER_TECHNICAL_REQUIREMENTS_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.furtherTechnicalRequirements.length,
            { max: FURTHER_TECHNICAL_REQUIREMENTS_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    furtherTechnicalRequirementsRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    roomSituation: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            ROOM_SITUATION_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.roomSituation.length,
            { max: ROOM_SITUATION_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    roomSituationRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    furtherRoomSituation: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            FURTHER_ROOM_SITUATION_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.furtherRoomSituation.length,
            { max: FURTHER_ROOM_SITUATION_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    furtherRoomSituationRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
  });
