import { assertAdditionalDisciplineLocales } from "./../../utils";

export const locale = assertAdditionalDisciplineLocales({
  and_art: {
    title: "+Art",
    description: null,
  },
  and_music: {
    title: "+Music",
    description: null,
  },
  and_design: {
    title: "+Design",
    description: null,
  },
  and_sports: {
    title: "+Sports",
    description: null,
  },
  and_society_politics: {
    title: "+Society / Politics",
    description: null,
  },
  and_environment: {
    title: "+Environment",
    description: null,
  },
} as const);
