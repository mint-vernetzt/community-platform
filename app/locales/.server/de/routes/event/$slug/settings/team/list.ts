export const locale = {
  title: "Aktuelles Team",
  explanation:
    "<0>Bitte beachte</0>: Es muss <0>mindestens ein Teammitglied</0> geben. ",
  list: {
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    searchPlaceholder: "Nach Teammitgliedern suchen...",
    remove: "Als Teammitglied entfernen",
    removeContactPerson: "Als Ansprechpartner:in entfernen",
    addContactPerson: "Als Ansprechpartner:in hinzufügen",
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
    addContactPersonFailed:
      "Das Hinzufügen der Ansprechpartner:in ist fehlgeschlagen.",
    removeContactPersonFailed:
      "Das Entfernen der Ansprechpartner:in ist fehlgeschlagen.",
  },
  success: {
    removeTeamMember: "Das Teammitglied wurde erfolgreich entfernt.",
    addContactPerson: "Die Ansprechpartner:in wurde erfolgreich hinzugefügt.",
    removeContactPerson: "Die Ansprechpartner:in wurde erfolgreich entfernt.",
  },
  mail: {
    removeTeamMemberSubject:
      "Du wurdest als Teammitglied eines Events entfernt",
    removeContactPersonSubject:
      "Du wurdest als Ansprechpartner:in eines Events entfernt",
    addContactPersonSubject:
      "Du wurdest als Ansprechpartner:in eines Events hinzugefügt",
  },
} as const;
