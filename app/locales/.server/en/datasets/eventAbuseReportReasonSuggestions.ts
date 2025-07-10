import { assertEventAbuseReportReasonSuggestionLocales } from "../../utils";

export const locale = assertEventAbuseReportReasonSuggestionLocales({
  promotional_event: {
    description: "This is a promotional event.",
  },
  inappropriate_content: {
    description: "Inappropriate content is shown.",
  },
  discriminatory_content: {
    description: "It contains discriminatory content.",
  },
} as const);
