export const locale = {
  team: {
    title: "Personen aus Deinem Event-Team als Admin hinzufügen",
    instruction:
      "Wähle Personen aus dem Event-Team aus und gib ihnen Admin-Rechte.",
    list: {
      more: "{{count}} weitere anzeigen",
      less: "{{count}} weniger anzeigen",
      add: "Als Administrator:in hinzufügen",
    },
    search: {
      label: "Duchrsuche die Teammitglieder",
      placeholder: "Name",
      hint: "Gib mindestens 3 Buchstaben ein.",
      validation: {
        min: "Bitte gib mindestens 3 Zeichen ein, um zu suchen.",
      },
    },
  },
  search: {
    title: "Weitere Personen als Administrator:innen einladen",
    explanation:
      "Die von Dir eingeladenen Personen müssen die Einladung annehmen, um Admin zu werden.",
    label: "Suche nach Personen",
    placeholder: "Name oder E-Mail-Adresse",
    hint: "Gib mindestens 3 Buchstaben ein.",
    submit: "Suchen",
    result_one: "Es wurde {{count}} Person gefunden.",
    result_other: "Es wurden {{count}} Personen gefunden.",
    invite: "Einladen",
    alreadyAdmin: "bereits Admin",
    alreadyInvited: "bereits angefragt",
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    validation: {
      min: "Bitte gib mindestens 3 Zeichen ein, um zu suchen.",
    },
  },
  errors: {
    inviteProfileAsAdmin:
      "Beim Einladen der Person ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    addTeamMemberAsAdmin:
      "Beim Hinzufügen des Teammitglieds als Admin ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
  success: {
    inviteProfileAsAdmin: "Die Einladung wurde erfolgreich versendet.",
    addTeamMemberAsAdmin:
      "Das Teammitglied wurde erfolgreich als Admin hinzugefügt.",
  },
} as const;
