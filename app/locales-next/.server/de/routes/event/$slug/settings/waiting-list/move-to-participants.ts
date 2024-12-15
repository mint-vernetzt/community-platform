export const locale = {
  email: {
    subject: "Deine Teilnahme an der Veranstaltung {{title}}",
    supportContact: {
      firstName: "Kein zuständiges Teammitglied gefunden",
      lastName: "Kein zuständiges Teammitglied gefunden",
      email: "Kein zuständiges Teammitglied gefunden",
    },
  },
  error: {
    mailer: "Mailer Issue",
    env: {
      url: "No community base url provided. Please add one inside the .env.",
      sender:
        "No system mail sender address provided. Please add one inside the .env.",
    },
    notFound: {
      event: "Event not found",
      profile: "Profile not found",
    },
    notPrivileged: "Not privileged",
  },
} as const;
