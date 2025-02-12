import { assertStageLocales } from "./../../utils";

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
    title: "On-Site",
    description: null,
  },
  all: {
    title: "All",
    description: null,
  },
} as const);
