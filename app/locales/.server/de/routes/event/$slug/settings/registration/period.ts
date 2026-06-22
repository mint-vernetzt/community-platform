export const locale = {
  headline: "Registrierungszeitraum",
  subline:
    "Der Registrierungzeitraum umfasst den Zeitraum, in dem es möglich ist, sich auf Dein Event anzumelden. Es ist nach Eventerstellung automatisch eingestellt.",
  default: {
    label: "Anmeldung bis zum Start möglich",
  },
  custom: {
    label: "Anmeldefrist selbst festlegen",
    form: {
      fields: {
        participationFromDate: "Startdatum für die Registrierung",
        participationFromTime: "Startzeit",
        participationUntilDate: "Enddatum für die Registrierung",
        participationUntilTime: "Endzeit",
      },
      submit: "Speichern",
      reset: "Änderungen verwerfen",
      errors: {
        participationFromDateRequired:
          "Bitte gib ein Startdatum für die Registrierung an.",
        participationFromTimeRequired:
          "Bitte gib eine Startzeit für die Registrierung an.",
        participationUntilDateRequired:
          "Bitte gib ein Enddatum für die Registrierung an.",
        participationUntilTimeRequired:
          "Bitte gib eine Endzeit für die Registrierung an.",
        participationUntilDateInPast:
          "Das Enddatum für die Registrierung liegt in der Vergangenheit.",
        participationUntilTimeInPast:
          "Die Endzeit für die Registrierung liegt in der Vergangenheit.",
        participationFromDateAfterParticipationUntilDate:
          "Der Start des Registrierungszeitraums beginnt erst nach dem Ende der Registrierungszeit.",
        participationFromTimeAfterParticipationUntilTime:
          "Die Startzeit liegt hinter der Endzeit.",
        participationFromDateAfterStartDate:
          "Dein Registrierungszeitraum beginnt erst nach dem Start Deines Events.",
        participationFromTimeAfterStartTime:
          "Die Startzeit des Registrierungszeitraums liegt hinter der Startzeit Deines Events.",
      },
    },
  },
  errors: {
    updateRegistrationPeriodError:
      "Es ist ein Fehler beim Aktualisieren des Registrierungszeitraums aufgetreten. Bitte versuche es erneut.",
  },
  success: {
    updateRegistrationPeriodSuccess:
      "Der Registrierungszeitraum wurde erfolgreich aktualisiert.",
  },
} as const;
