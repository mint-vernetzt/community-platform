import { assertExperienceLevelLocales } from "../../utils";

export const locale = assertExperienceLevelLocales({
  "entry-level": {
    title: "Einstiegs Niveau",
    description: null,
  },
  advanced: {
    title: "Fortgeschrittenes Niveau",
    description: null,
  },
  intermediate: {
    title: "Mittleres Niveau",
    description: null,
  },
  professional: {
    title: "Professionelles Niveau",
    description: null,
  },
  "not-relevant": {
    title: "Nicht relevant",
    description: null,
  },
} as const);
