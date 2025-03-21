import { assertStageLocales } from "../../utils";

export const locale = assertStageLocales({
  hybrid: {
    title: "Hybrid",
    description: null,
  },
  online: {
    title: "Online",
    description: null,
  },
  "on-site": {
    title: "Vor Ort",
    description: null,
  },
  all: {
    title: "Alle",
    description: null,
  },
} as const);
