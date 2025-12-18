import { z } from "zod";
import { type ProjectDetailsSettingsLocales } from "./details.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { removeHtmlTags, replaceHtmlEntities } from "~/lib/utils/transformHtml";
import { createYoutubeEmbedSchema } from "~/lib/utils/schemas";

export const TARGET_GROUP_ADDITIONS_MAX_LENGTH = 200;
export const EXCERPT_MAX_LENGTH = 250;
export const IDEA_MAX_LENGTH = 2000;
export const GOALS_MAX_LENGTH = 2000;
export const IMPLEMENTATION_MAX_LENGTH = 2000;
export const FURTHER_DESCRIPTION_MAX_LENGTH = 8000;
export const TARGETING_MAX_LENGTH = 800;
export const HINTS_MAX_LENGTH = 800;
export const VIDEO_SUBLINE_MAX_LENGTH = 80;

export const createDetailSchema = (locales: ProjectDetailsSettingsLocales) =>
  z.object({
    disciplines: z.array(z.string().trim().uuid()),
    additionalDisciplines: z.array(z.string().trim().uuid()),
    furtherDisciplines: z.array(z.string().trim()),
    participantLimit: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    projectTargetGroups: z.array(z.string().trim().uuid()),
    specialTargetGroups: z.array(z.string().trim().uuid()),
    targetGroupAdditions: z
      .string()
      .trim()
      .max(
        TARGET_GROUP_ADDITIONS_MAX_LENGTH,
        insertParametersIntoLocale(
          locales.route.validation.targetGroupAdditions.max,
          { max: TARGET_GROUP_ADDITIONS_MAX_LENGTH }
        )
      )
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    excerpt: z
      .string()
      .trim()
      .max(
        EXCERPT_MAX_LENGTH,
        insertParametersIntoLocale(locales.route.validation.excerpt.max, {
          max: EXCERPT_MAX_LENGTH,
        })
      )
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    idea: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            IDEA_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.idea.message,
            { max: IDEA_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined") {
          return null;
        }
        const trimmedRTEValue = value
          .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
          .trim();
        if (trimmedRTEValue === "") {
          return null;
        }
        return trimmedRTEValue;
      }),
    ideaRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    goals: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            GOALS_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.goals.message,
            { max: GOALS_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined") {
          return null;
        }
        const trimmedRTEValue = value
          .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
          .trim();
        if (trimmedRTEValue === "") {
          return null;
        }
        return trimmedRTEValue;
      }),
    goalsRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    implementation: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            IMPLEMENTATION_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.implementation.message,
            { max: IMPLEMENTATION_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined") {
          return null;
        }
        const trimmedRTEValue = value
          .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
          .trim();
        if (trimmedRTEValue === "") {
          return null;
        }
        return trimmedRTEValue;
      }),
    implementationRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    furtherDescription: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            FURTHER_DESCRIPTION_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.furtherDescription.message,
            { max: FURTHER_DESCRIPTION_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined") {
          return null;
        }
        const trimmedRTEValue = value
          .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
          .trim();
        if (trimmedRTEValue === "") {
          return null;
        }
        return trimmedRTEValue;
      }),
    furtherDescriptionRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    targeting: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            TARGETING_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.targeting.message,
            { max: TARGETING_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined") {
          return null;
        }
        const trimmedRTEValue = value
          .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
          .trim();
        if (trimmedRTEValue === "") {
          return null;
        }
        return trimmedRTEValue;
      }),
    targetingRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    hints: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          return (
            replaceHtmlEntities(removeHtmlTags(value || ""), "x").length <=
            HINTS_MAX_LENGTH
          );
        },
        {
          message: insertParametersIntoLocale(
            locales.route.validation.hints.message,
            { max: HINTS_MAX_LENGTH }
          ),
        }
      )
      .transform((value) => {
        if (typeof value === "undefined") {
          return null;
        }
        const trimmedRTEValue = value
          .replaceAll(/^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g, "")
          .trim();
        if (trimmedRTEValue === "") {
          return null;
        }
        return trimmedRTEValue;
      }),
    hintsRTEState: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
    video: createYoutubeEmbedSchema(locales),
    videoSubline: z
      .string()
      .trim()
      .max(
        VIDEO_SUBLINE_MAX_LENGTH,
        insertParametersIntoLocale(locales.route.validation.videoSubline.max, {
          max: VIDEO_SUBLINE_MAX_LENGTH,
        })
      )
      .optional()
      .transform((value) => {
        if (typeof value === "undefined" || value === "") {
          return null;
        }
        return value;
      }),
  });
