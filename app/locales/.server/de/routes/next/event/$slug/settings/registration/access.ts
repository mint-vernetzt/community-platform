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
      hint: "Wenn Du für Dein Event eine externe Registrierung nutzt, dann kannst Du auf der Plattform <0>keine Teilnehmendenverwaltung nutzen</0> und <0>keinen Registrierungszeitraum</0> einstellen.",
      form: {
        registrationUrl: {
          label: "Externer Registrierungslink",
          placeholder: "Gib eine URL an.",
        },
        submit: "URL ändern",
        reset: "Änderung verwerfen",
        errors: {
          required: "Bitte gib eine URL an.",
          invalidUrl: "Die angegebene URL ist ungültig.",
        },
        success:
          "Der externe Registrierungslink wurde erfolgreich aktualisiert.",
      },
    },
  },
  access: {
    headline:
      "Handelt es sich um eine öffentliche oder geschlossene Veranstaltung?",
    subline: "Kontrolliere, wer zu Deiner Veranstaltung kommen kann.",
    open: {
      headline: "Öffentliche Veranstaltung",
      subline: "Für alle Nutzer:innen sichtbar und zugänglich.",
    },
    closed: {
      headline: "Geschlossene Veranstaltung",
      subline:
        "Nur auf Einladung zugänglich. Diese Option ist bei externer Registrierung nicht verfügbar.",
    },
  },
  errors: {
    validationError: "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    updateTypeFailed:
      "Die Aktualisierung der Registrierungsart ist fehlgeschlagen. Bitte versuche es erneut.",
    updateAccessFailed:
      "Die Aktualisierung der Registrierungszugangseinstellung ist fehlgeschlagen. Bitte versuche es erneut.",
    updateRegistrationUrlFailed:
      "Die Aktualisierung des externen Registrierungslinks ist fehlgeschlagen. Bitte versuche es erneut.",
  },
} as const;
