import { assertEventTargetGroupLocales } from "../../utils";

export const locale = assertEventTargetGroupLocales({
  early_childhood_education: {
    title: "Frühkindliche Bildung",
    description: null,
  },
  hochschulbildung: {
    title: "Hochschulbildung",
    description: null,
  },
  teachers: {
    title: "Lehrkräfte",
    description: null,
  },
  lernbegleiterinnen: {
    title: "Lernbegleiter:innen",
    description: null,
  },
  "paedagogische-fachkraefte": {
    title: "Pädagogische Fachkräfte",
    description: null,
  },
  primarbereich: {
    title: "Primarbereich",
    description: null,
  },
  qualification: {
    title: "Qualifizierung",
    description: null,
  },
  secondary_education_1: {
    title: "Sek 1",
    description: null,
  },
  secondary_education_2: {
    title: "Sek 2",
    description: null,
  },
} as const);
