export const locale = {
  type: {
    headline: "Art der Registrierung",
    helpIcon: {
      label: "Weitere Informationen zur Art der Registrierung",
    },
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
  parentParticipation: {
    headline: "Festlegung zur Registrierung für untergeordnete Events",
    helpIcon: {
      label:
        "Weitere Informationen zur Registrierung für untergeordnete Events",
    },
    subline: {
      parent:
        "Lege fest, ob sich Deine Teilnehmenden unabhängig von der Rahmenveranstaltung für einzelne Unterveranstaltungen anmelden können – oder ob zunächst eine Anmeldung zur Rahmenveranstaltung erforderlich ist.",
      child: {
        general:
          "Lege fest, ob sich Deine Teilnehmenden unabhängig von der Rahmenveranstaltung für dieses Unterevent anmelden können – oder ob zunächst eine Anmeldung zur Rahmenveranstaltung erforderlich ist.",
        childException:
          "Unabhängig von der Einstellung im Rahmenevent, kannst Du im Unterevent eine andere Regel festlegen.",
        sameAsParent: "Aktuelle Einstellung in der Rahmenveranstaltung:",
      },
    },
    hint: "Diese Einstellung gilt für alle untergeordneten Veranstaltungen. Du kannst jedoch innerhalb jeder einzelnen Unterveranstaltung eigene Regeln festlegen und damit diese Einstellung bei Bedarf anpassen.",
    required:
      "Teilnehmende müssen sich zuerst für die Rahmenveranstaltung anmelden.",
    notRequired: {
      parent:
        "Teilnehmende können sich direkt für Unterveranstaltungen anmelden.",
      child: "Teilnehmende können sich direkt für dieses Unterevent anmelden.",
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
    eventPublished:
      "Da Deine Veranstaltung bereits veröffentlicht ist, kannst Du die Registrierungsart oder die Zugänglichkeit nicht mehr ändern.",
    updateParentParticipationFailed:
      "Die Aktualisierung der Einstellung zur Registrierung für untergeordnete Events ist fehlgeschlagen. Bitte versuche es erneut.",
  },
} as const;
