import { assertEventAbuseReportReasonSuggestionLocales } from "../../utils";

export const locale = assertEventAbuseReportReasonSuggestionLocales({
  promotional_event: {
    description: "This is a promotional event.",
  },
  inappropriate_pictures: {
    description: "Inappropriate pictures are shown.",
  },
  discriminatory_content: {
    description: "It contains discriminatory content.",
  },
} as const);
