export const locale = {
  email: {
    subject: "Your participation in the event {{title}}",
    supportContact: {
      firstName: "No responsible team member found",
      lastName: "No responsible team member found",
      email: "No responsible team member found",
    },
  },
  error: {
    mailer: "Mailer issue",
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
