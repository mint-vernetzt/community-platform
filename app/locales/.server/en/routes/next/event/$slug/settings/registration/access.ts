export const locale = {
  type: {
    headline: "Type of Registration",
    subline:
      "Here you decide where your participants register - either directly through the platform or through an external registration tool that you can link to.",
    hint: "After publishing, you can no longer change the type of registration.",
    internal: {
      headline: "Internal Registration (Recommended)",
      subline: "Your participants register through this platform.",
    },
    external: {
      headline: "External Registration",
      subline:
        "Your participants are redirected to your external registration tool.",
    },
  },
  access: {
    headline: "Is this a public or private event?",
    subline: "Control who can attend your event.",
  },
} as const;
