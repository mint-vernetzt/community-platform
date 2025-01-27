import { assertSpecialTargetGroupLocales } from "../../utils";

export const locale = assertSpecialTargetGroupLocales({
  social_background_disadvantage: {
    title: "People disadvantaged due to their social background",
    description: null,
  },
  women_and_girls: {
    title: "Women and / or girls",
    description: null,
  },
  trans_inter_and_non_binary: {
    title: "Trans*, inter* and non-binary people",
    description: null,
  },
  disabled_people: {
    title: "Disabled people",
    description: null,
  },
  neurodivergent_people: {
    title: "Neurodivergent people",
    description:
      "The term neurodivergence describes all people who deviate from the neurotypical grid due to neurological or psychological reasons. This includes, for example, autistic people, people with dyslexia and people with ADHD.",
  },
  migration_experience: {
    title: "People with migration experience",
    description: null,
  },
  refugees: {
    title: "Refugees",
    description: null,
  },
  people_of_color: {
    title: "People of Color",
    description:
      "Political self-designation among all non-white people of African, Asian, Latin American, Arab, Jewish, indigenous or Pacific family origin.",
  },
  lgbtqia_plus: {
    title: "LGBTQIA+ people",
    description:
      "Lesbians, Gays, Bisexuals, Trans persons, Queer people, Inter- and Asexuals.",
  },
  highly_gifted: {
    title: "Highly gifted people",
    description: null,
  },
  others: {
    title: "Others",
    description: null,
  },
} as const);
