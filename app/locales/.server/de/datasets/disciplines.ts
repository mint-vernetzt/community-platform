import { assertDisciplineLocales } from "../../utils";

export const locale = assertDisciplineLocales({
  math: {
    title: "Mathe",
    description: null,
  },
  computer_science: {
    title: "Informatik",
    description: null,
  },
  biology: {
    title: "Biologie",
    description: null,
  },
  chemistry: {
    title: "Chemie",
    description: null,
  },
  physics: {
    title: "Physik",
    description: null,
  },
  astronomy: {
    title: "Astronomie",
    description: null,
  },
  technology: {
    title: "Technik",
    description: null,
  },
  all: {
    title: "MINT gesamt",
    description: null,
  },
  natural_sciences: {
    title: "Naturwissenschaften",
    description: null,
  },
} as const);
