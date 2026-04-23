export const locale = {
  type: {
    headline: "Art der Registrierung",
    subline:
      "Hier entscheidest Du, wo sich Deine Teilnehmenden anmelden – entweder direkt über die Plattform oder über ein externes Anmeldetool, das Du per Verlinkung einfügen kannst.",
    hint: "Nach der Veröffentlichung kannst Du die Registrierungsart nicht mehr ändern.",
    internal: {
      headline: "Interne Registrierung (Empfohlen)",
      subline: "Deine Teilnehmenden melden sich über diese Plattform an.",
    },
    external: {
      headline: "Externe Registrierung",
      subline:
        "Deine Teilnehmenden werden zu Deinem externen Anmeldetool weitergeleitet.",
    },
  },
  access: {
    headline:
      "Handelt es sich um eine öffentliche oder geschlossene Veranstaltung?",
    subline: "Kontrolliere, wer zu Deiner Veranstaltung kommen kann.",
  },
} as const;
