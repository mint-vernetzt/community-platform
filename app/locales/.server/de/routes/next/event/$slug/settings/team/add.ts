export const locale = {
  team: {
    title: "Administrator:innen als Teammitglied hinzufügen",
    instruction:
      "Wähle Personen aus Deiner Adminliste des Events aus, um sie zum Teammitglied zu machen.",
    list: {
      more: "{{count}} weitere anzeigen",
      less: "{{count}} weniger anzeigen",
      add: "Als Teammitglied hinzufügen",
    },
    search: {
      label: "Durchsuche die Teammitglieder",
      placeholder: "Name",
      hint: "Gib mindestens 3 Buchstaben ein.",
      validation: {
        min: "Bitte gib mindestens 3 Zeichen ein, um zu suchen.",
      },
    },
  },
  search: {
    title: "Weitere Personen als Teammitglied einladen",
    explanation:
      "Die von Dir eingeladenen Personen müssen die Einladung annehmen, um Teammitglied zu werden.",
    label: "Suche nach Personen",
    placeholder: "Name oder E-Mail-Adresse",
    hint: "Gib mindestens 3 Buchstaben ein.",
    submit: "Suchen",
    result_one: "Es wurde {{count}} Person gefunden.",
    result_other: "Es wurden {{count}} Personen gefunden.",
    invite: "Einladen",
    alreadyTeamMember: "bereits Teammitglied",
    alreadyInvited: "bereits angefragt",
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    validation: {
      min: "Bitte gib mindestens 3 Zeichen ein, um zu suchen.",
    },
  },
  errors: {
    inviteProfileAsTeamMember:
      "Beim Einladen der Person ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    addAdminAsTeamMember:
      "Beim Hinzufügen des Admins als Teammitglied ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
  success: {
    inviteProfileAsTeamMember: "Die Einladung wurde erfolgreich versendet.",
    addAdminAsTeamMember:
      "Der Admin wurde erfolgreich als Teammitglied hinzugefügt.",
  },
  mail: {
    buttonText: "Zur Community Plattform",
    subject: "Du wurdest als Admin zu einem Event eingeladen",
  },
} as const;
