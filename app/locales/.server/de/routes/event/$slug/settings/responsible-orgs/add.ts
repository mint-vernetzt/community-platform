export const locale = {
  ownOrganizations: {
    title: "Eigene Organisationen als verantwortliche Organisation hinzufügen",
    instruction:
      "Füge Deinem Event eine oder mehrere Deiner Organisationen als verantwortliche Organisationen hinzu.",
    list: {
      more: "{{count}} weitere anzeigen",
      less: "{{count}} weniger anzeigen",
      add: "Hinzufügen",
    },
    search: {
      label: "Durchsuche die Organisationen",
      placeholder: "Organisationsname",
      hint: "Gib mindestens 3 Buchstaben ein.",
      validation: {
        min: "Bitte gib mindestens 3 Zeichen ein, um zu suchen.",
      },
    },
  },
  search: {
    title: "Andere Organisationen hinzufügen",
    explanation:
      "Lade Deinem Event eine bereits bestehende Organisation als verantwortliche Organisation ein. Die Admins der von Dir eingeladenen Organisationen müssen die Einladung annehmen, um als verantwortliche Organisation gelistet zu werden.",
    label: "Suche nach Organisationen",
    placeholder: "Organisationsname",
    hint: "Gib mindestens 3 Buchstaben ein.",
    submit: "Suchen",
    result_one: "Es wurde {{count}} Organisation gefunden.",
    result_other: "Es wurden {{count}} Organisationen gefunden.",
    invite: "Einladen",
    alreadyResponsibleOrganization: "bereits verantwortliche Organisation",
    alreadyInvited: "bereits angefragt",
    more: "{{count}} weitere anzeigen",
    less: "{{count}} weniger anzeigen",
    validation: {
      min: "Bitte gib mindestens 3 Zeichen ein, um zu suchen.",
    },
  },
  errors: {
    inviteResponsibleOrganization:
      "Beim Einladen der Organisation ist ein Fehler aufgetreten. Bitte versuche es erneut.",
    addOwnOrganization:
      "Beim Hinzufügen der eigenen Organisation als verantwortliche Organisation ist ein Fehler aufgetreten. Bitte versuche es erneut.",
  },
  success: {
    inviteResponsibleOrganization: "Die Einladung wurde erfolgreich versendet.",
    addOwnOrganization:
      "Die eigene Organisation wurde erfolgreich als verantwortliche Organisation hinzugefügt.",
  },
  mail: {
    buttonText: "Zur Community Plattform",
    subject:
      "Deine Organisation wurde als verantwortliche Organisation zu einem Event eingeladen",
  },
} as const;
