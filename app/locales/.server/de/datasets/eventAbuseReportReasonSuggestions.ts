import { assertEventAbuseReportReasonSuggestionLocales } from "../../utils";

export const locale = assertEventAbuseReportReasonSuggestionLocales({
  promotional_event: {
    description: "Es handelt sich um eine Werbeveranstaltung.",
  },
  inappropriate_content: {
    description: "Es werden unpassende Inhalte gezeigt.",
  },
  discriminatory_content: {
    description: "Es enthält diskriminierende Inhalte.",
  },
} as const);
