export const locale = {
  error: {
    organizationNotFound: "Organization or organization visibility not found",
    updateFailed:
      "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support",
  },
  content: {
    success: "Data saved!",
    prompt:
      "You have unsaved changes. These will be lost if you go one step further now.",
    back: "Website and social networks",
    intro: "Where can the community find out more about your organization?",
  },
  form: {
    reset: "Discard changes",
    submit: "Save",
    hint: {
      public: "Visible to everyone",
      private: "Visible only to registered users",
    },
    website: {
      headline: "Website",
      url: {
        label: "URL",
        placeholder: "https://domain.tld/...",
      },
    },
    socialNetworks: {
      headline: "Social networks",
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
