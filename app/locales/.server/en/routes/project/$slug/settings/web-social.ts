export const locale = {
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    custom:
      "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support",
  },
  content: {
    success: "Data saved!",
    prompt:
      "You have unsaved changes. These will be lost if you go one step further now.",
    back: "Website and social networks",
    intro:
      "Where can the community find out more about your project or educational offering?",
  },
  form: {
    reset: "Discard changes",
    submit: "Save",
    website: {
      headline: "Website",
      url: {
        label: "URL",
        placeholder: "domain.tld/...",
      },
    },
    socialNetworks: {
      headline: "Social networks",
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
