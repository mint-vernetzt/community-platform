export const locale = {
  error: {
    notFound: "Organization not found",
    notPrivileged: "Not privileged",
    inputError: {
      doesNotExist: "Es existiert noch kein Profil unter diesem Namen.",
      alreadyAdmin:
        "Das Profil unter diesem Namen ist bereits Administrator:in Eurer Organisation.",
    },
  },
  invite: {
    success: "Einladung wurde erfolgreich versendet.",
    error: "Einladung konnte nicht versendet werden.",
  },
  email: {
    subject: "Du hast eine Einladung zum Admin erhalten!",
    button: {
      text: "Zur Community Plattform",
    },
  },
  feedback:
    '"{{firstName} {{lastName}}" wurde als Administrator:in hinzugefügt.',
} as const;
