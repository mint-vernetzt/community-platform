import { assertEventTargetGroupLocales } from "./../../utils";

export const locale = assertEventTargetGroupLocales({
  early_childhood_education: {
    title: "Early Childhood Education",
    description: null,
  },
  hochschulbildung: {
    title: "Higher Education",
    description: null,
  },
  teachers: {
    title: "Teachers",
    description: null,
  },
  lernbegleiterinnen: {
    title: "Learning Assistants",
    description: null,
  },
  "paedagogische-fachkraefte": {
    title: "Pedagogical Specialists",
    description: null,
  },
  primarbereich: {
    title: "Primary Education",
    description: null,
  },
  qualification: {
    title: "Professional Development",
    description: null,
  },
  secondary_education_1: {
    title: "Secondary Education 1 (Grades 5-10)",
    description: null,
  },
  secondary_education_2: {
    title: "Secondary Education 2 (Grades 10-13)",
    description: null,
  },
} as const);
