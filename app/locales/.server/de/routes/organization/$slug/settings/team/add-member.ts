export const locale = {
  error: {
    notFound: "Organization not found",
    notPrivileged: "Not privileged",
    inputError: {
      doesNotExist: "Es existiert noch kein Profil unter diesem Namen.",
      alreadyMember:
        "Das Profil unter diesem Namen ist bereits Mitglied Eurer Organisation.",
    },
  },
  invite: {
    success:
      "Einladung an {{firstName}} {{lastName}} wurde erfolgreich versendet.",
    error: "Einladung konnte nicht versendet werden.",
  },
  email: {
    subject: "Du hast eine Einladung erhalten!",
    button: {
      text: "Zur Community Plattform",
    },
  },
  feedback:
    'Ein neues Teammitglied mit dem Namen "{{firstName}} {{lastName}}" wurde hinzugefügt.',
} as const;
