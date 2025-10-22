export const locale = {
  server: {
    error: {
      organizationNotFound: "Organisation nicht gefunden",
    },
  },
  headlines: {
    bio: "Über uns",
    areas: "Aktivitätsgebiete",
    focuses: "Schwerpunkte",
    supportedBy: "Unterstützt und gefördert von",
    contact: "Kontakt",
  },
  blankState: {
    admin: {
      headline: "Du hast noch keine weiteren Infos angelegt.",
      subline: "Teile Deine Informationen, um besser gefunden zu werden!",
      cta: "Jetzt Infos anlegen",
    },
    authenticated: {
      info: "Es wurden noch keine weiteren Infos angelegt.",
    },
    anon: {
      info: "Es wurden keine öffentlichen Infos angelegt.",
    },
  },
} as const;
