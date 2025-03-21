import { assertProjectTargetGroupLocales } from "./../../utils";

export const locale = assertProjectTargetGroupLocales({
  childs_in_preschool: {
    title: "Children in daycare or preschool",
    description: null,
  },
  childs_in_primary_level: {
    title: "Children primary level",
    description: null,
  },
  pupils_in_sek_1: {
    title: "Pupils Sek. I",
    description: null,
  },
  pupils_in_sek_2: {
    title: "Pupils Sek. II",
    description: null,
  },
  young_adults: {
    title: "Young adults",
    description: null,
  },
  students: {
    title: "Students in general",
    description: null,
  },
  students_of_the_teaching_profession: {
    title: "Students of the teaching profession",
    description: null,
  },
  apprentices: {
    title: "Apprentices",
    description: null,
  },
  teachers_preschool_and_primary_level: {
    title: "Teachers preschool and primary level",
    description: null,
  },
  teachers_sek_1: {
    title: "Teachers Sek. I",
    description: null,
  },
  teachers_sek_2: {
    title: "Teachers Sek. II",
    description: null,
  },
  lecturer: {
    title: "Lecturers at universities",
    description: null,
  },
  educators_school: {
    title: "Educators (school)",
    description: null,
  },
  educators_preschool: {
    title: "Educators (daycare)",
    description: null,
  },
  scientists: {
    title: "Scientists",
    description: null,
  },
  mint_coordinators_and_multiplicators: {
    title: "Coordinators and multipliers of STEM education programs",
    description: null,
  },
  parents_of_pupils: {
    title: "Parents of pupils",
    description: null,
  },
} as const);
