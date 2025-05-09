import { assertDisciplineLocales } from "./../../utils";

export const locale = assertDisciplineLocales({
  math: {
    title: "Mathematics",
    description: null,
  },
  computer_science: {
    title: "Computer Science",
    description: null,
  },
  biology: {
    title: "Biology",
    description: null,
  },
  chemistry: {
    title: "Chemistry",
    description: null,
  },
  physics: {
    title: "Physics",
    description: null,
  },
  astronomy: {
    title: "Astronomy",
    description: null,
  },
  technology: {
    title: "Technology",
    description: null,
  },
  all: {
    title: "STEM total",
    description: null,
  },
  natural_sciences: {
    title: "Natural Sciences",
    description: null,
  },
} as const);
