export const locale = {
  error: {
    projectNotFound: "Project not found",
    updateFailed:
      "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support",
  },
  content: {
    success: "Daten gespeichert!",
    prompt:
      "Du hast ungespeicherte Änderungen. Diese gehen verloren, wenn Du jetzt einen Schritt weiter gehst.",
    back: "Website und Soziale Netzwerke",
    intro: "Wo kann die Community mehr über Dein Projekt erfahren?",
  },
  form: {
    reset: "Änderungen verwerfen",
    submit: "Speichern",
    hint: {
      public: "Für alle sichtbar",
      private: "Nur für registrierte Nutzer:innen sichtbar",
    },
    website: {
      headline: "Website",
      url: {
        label: "URL",
        placeholder: "https://domain.tld/...",
      },
    },
    socialNetworks: {
      headline: "Soziale Netzwerke",
      facebook: {
        label: "Facebook",
        placeholder: "https://facebook.com/...",
      },
      linkedin: {
        label: "LinkedIn",
        placeholder: "https://linkedin.com/...",
      },
      xing: {
        label: "Xing",
        placeholder: "https://xing.com/...",
      },
      twitter: {
        label: "X (Twitter)",
        placeholder: "https://x.com/...",
      },
      mastodon: {
        label: "Mastodon",
        placeholder: "https://domain.tld/...",
      },
      tiktok: {
        label: "TikTok",
        placeholder: "https://tiktok.com/...",
      },
      instagram: {
        label: "Instagram",
        placeholder: "https://instagram.com/...",
      },
      youtube: {
        label: "YouTube",
        placeholder: "https://youtube.com/...",
      },
    },
  },
} as const;
