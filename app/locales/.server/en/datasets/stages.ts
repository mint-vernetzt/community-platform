import { StageLocales } from "./../../utils";

export const locale: StageLocales & {
  // "all" is not in the database but used for the "All" filter
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
    title: "On-Site",
    description: null,
  },
  all: {
    title: "All",
    description: null,
  },
};
