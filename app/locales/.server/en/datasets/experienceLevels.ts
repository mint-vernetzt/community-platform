import { assertExperienceLevelLocales } from "./../../utils";

export const locale = assertExperienceLevelLocales({
  "entry-level": {
    title: "Beginner Level",
    description: null,
  },
  advanced: {
    title: "Advanced Level",
    description: null,
  },
  intermediate: {
    title: "Intermediate Level",
    description: null,
  },
  professional: {
    title: "Professional Level",
    description: null,
  },
  "not-relevant": {
    title: "Not relevant",
    description: null,
  },
} as const);
