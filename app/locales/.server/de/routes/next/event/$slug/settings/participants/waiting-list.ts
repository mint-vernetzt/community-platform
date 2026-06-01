export const locale = {
  title: "Teilnehmende von der Warteliste hinzufügen",
  subline:
    "Du kannst manuell Personen von der Warteliste als Teilnehmende zulassen, auch wenn die maximale Anzahl der Teilnehmenden bereits erreicht ist.",
  hints: {
    automaticallyMoveToParticipants:
      "<0>Hinweis</0>: Auf der Seite <0>Registrierung > </0><1>Teilnahmebegrenzung</1> hast Du ausgewählt, dass freigewordene Plätze automatisch nachbesetzt werden. Du kannst aber auch weiterhin einzelne Personen manuell als Teilnehmende hinzufügen.",
    manuallyMoveToParticipants:
      "<0>Hinweis</0>: Sollen die Wartenden automatisch nachrücken, sobald ein Platz frei wird? Diese Einstellung findest Du unter <0>Registrierung > </0><1>Teilnahmebegrenzung</1>.",
  },
  search: {
    label: "Suche Personen",
    placeholder: "Nach Namen suchen",
  },
  list: {
    item: {
      subline: "wartet seit {{date}} Uhr (MEZ)",
      add: "Als Teilnehmer:in zulassen",
    },
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
  },
  errors: {
    moveToParticipants:
      "Beim Hinzufügen der Person zu den Teilnehmenden ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
  success: {
    moveToParticipants:
      "Die Person wurde von der Warteliste zu den Teilnehmenden hinzugefügt.",
  },
  mail: {
    moveToParticipants: {
      subject:
        "Du wurdest von der Warteliste zu den Teilnehmenden eines Events hinzugefügt",
    },
  },
} as const;
