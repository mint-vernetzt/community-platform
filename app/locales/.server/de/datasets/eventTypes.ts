import { assertEventTypeLocales } from "../../utils";

export const locale = assertEventTypeLocales({
  exchange: {
    title: "Austauschrunde",
    description: null,
  },
  "find-your-match": {
    title: "Finde deinen Match",
    description: null,
  },
  "keynote-speech": {
    title: "Impulsvortrag",
    description: null,
  },
  keynote: {
    title: "Keynote",
    description: null,
  },
  workshop: {
    title: "Moderierter Workshop",
    description: null,
  },
  "public-office-hour": {
    title: "Sprechstunde",
    description: null,
  },
  "panel-discussion": {
    title: "Paneldiskussion",
    description: null,
  },
  "speed-dating": {
    title: "Speed-Dating",
    description: null,
  },
} as const);
