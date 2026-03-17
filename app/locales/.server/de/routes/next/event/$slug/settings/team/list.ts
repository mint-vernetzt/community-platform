export const locale = {
  title: "Aktuelles Team",
  explanation:
    "<0>Bitte beachte</0>: Es muss <0>mindestens ein Teammitglied</0> geben. ",
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    searchPlaceholder: "Nach Teammitgliedern suchen...",
    remove: "Entfernen",
  },
  confirmation: {
    title: "Willst Du Dich wirklich als Teammitglied entfernen?",
    description:
      "Wenn Du Dich als Teammitglied entfernst, hast Du keinen Zugriff mehr auf die Bearbeitung Deines Events.",
    confirm: "Als Teammitglied entfernen",
    abort: "Abbrechen",
  },
  errors: {
    removeLastTeamMember:
      "Du kannst das letzte Teammitglied des Events nicht entfernen.",
    removeTeamMemberFailed:
      "Das Entfernen des Teammitglieds ist fehlgeschlagen.",
  },
  success: {
    removeTeamMember: "Das Teammitglied wurde erfolgreich entfernt.",
  },
  mail: {
    subject: "Du wurdest als Teammitglied eines Events entfernt",
  },
} as const;
