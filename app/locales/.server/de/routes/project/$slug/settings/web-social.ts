export const locale = {
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    custom:
      "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support",
  },
  content: {
    success: "Daten gespeichert!",
    prompt:
      "Du hast ungespeicherte Änderungen. Diese gehen verloren, wenn Du jetzt einen Schritt weiter gehst.",
    back: "Website und Soziale Netzwerke",
    intro:
      "Wo kann die Community mehr über Dein Projekt oder Bildungsangebot erfahren?",
  },
  form: {
    reset: "Änderungen verwerfen",
    submit: "Speichern",
    website: {
      headline: "Website",
      url: {
        label: "URL",
        placeholder: "domain.tld/...",
      },
    },
    socialNetworks: {
      headline: "Soziale Netzwerke",
      facebook: {
        label: "Facebook",
        placeholder: "facebook.com/...",
      },
      linkedin: {
        label: "LinkedIn",
        placeholder: "linkedin.com/...",
      },
      xing: {
        label: "Xing",
        placeholder: "xing.com/...",
      },
      twitter: {
        label: "X (Twitter)",
        placeholder: "x.com/...",
      },
      mastodon: {
        label: "Mastodon",
        placeholder: "domain.tld/...",
      },
      tiktok: {
        label: "TikTok",
        placeholder: "tiktok.com/...",
      },
      instagram: {
        label: "Instagram",
        placeholder: "instagram.com/...",
      },
      youtube: {
        label: "YouTube",
        placeholder: "youtube.com/...",
      },
    },
  },
} as const;
