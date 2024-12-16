export const locale = {
  error: {
    notFound: "Organization not found",
    notPrivileged: "Not privileged",
  },
  content: {
    headline: "Das Team",
    intro1:
      "Wer ist Teil Eurer Organisation? Füge hier weitere Teammitglieder hinzu oder entferne sie.",
    intro2:
      "Team-Mitglieder werden auf der Organisations-Detailseite gezeigt. Sie können Organisationen nicht bearbeiten.",
    add: {
      headline: "Teammitglied hinzufügen",
      intro:
        "Füge hier Eurer Organisation ein bereits bestehendes Profil hinzu.",
      label: "Name oder Email",
    },
    invites: {
      headline: "Einladungen",
      intro: "Hier siehst Du alle Einladungen, die Du bereits versendet hast.",
      cancel: "zurückziehen",
    },
    current: {
      headline: "Aktuelle Teammitglieder",
      intro: "Hier siehst Du alle Teammitglieder auf einen Blick.",
      remove: "entfernen",
    },
  },
} as const;
