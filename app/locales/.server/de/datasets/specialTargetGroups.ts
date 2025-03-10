import { assertSpecialTargetGroupLocales } from "../../utils";

export const locale = assertSpecialTargetGroupLocales({
  social_background_disadvantage: {
    title: "Aufgrund von sozialer Herkunft benachteiligte Menschen",
    description: null,
  },
  women_and_girls: {
    title: "Madchen und / oder Frauen",
    description: null,
  },
  trans_inter_and_non_binary: {
    title: "Trans*, inter* und nonbinäre Menschen",
    description: null,
  },
  disabled_people: {
    title: "Menschen mit Behinderung",
    description: null,
  },
  neurodivergent_people: {
    title: "Neurodivergente Menschen",
    description:
      "Der Begriff Neurodivergenz beschreibt alle Menschen, die wegen neurologischen oder psychischen Gründen von dem neurotypischen Raster abweichen. Hierunter fallen beispielsweise Autist:innen, Legastheniker:innen und Personen mit ADHS.",
  },
  migration_experience: {
    title: "Menschen mit Migrationserfahrung",
    description: null,
  },
  refugees: {
    title: "Geflüchtete Menschen",
    description: null,
  },
  people_of_color: {
    title: "People of Color",
    description:
      "Politische Selbstbezeichnung zwischen allen nicht-weißen Menschen afrikanischer, asiatischer, lateinamerikanischer, arabischer, jüdischer, indigener oder pazifischer familiärer Herkunft.",
  },
  lgbtqia_plus: {
    title: "LGBTQIA+ Menschen",
    description:
      "Lesben, Gays (Schwule), Bisexuelle, Trans-Personen, queere Menschen, Inter- und Asexuelle.",
  },
  highly_gifted: {
    title: "Hochbegabte",
    description: null,
  },
  others: {
    title: "Sonstige",
    description: null,
  },
} as const);
