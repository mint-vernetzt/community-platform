import { StageLocales } from "../../utils";

export const locale: StageLocales & {
  all: {
    title: string;
    description: string | null;
  };
} = {
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
} as const;
