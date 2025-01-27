import { assertEventAbuseReportReasonSuggestionLocales } from "../../utils";

export const locale = assertEventAbuseReportReasonSuggestionLocales({
  promotional_event: {
    description: "Es handelt sich um eine Werbeveranstaltung.",
  },
  inappropriate_pictures: {
    description: "Es werden unpassende Bilder gezeigt.",
  },
  discriminatory_content: {
    description: "Es enthält diskriminierende Inhalte.",
  },
} as const);
