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
      hint: "If you use external registration for your event, you <0>cannot use participant management</0> and <0>cannot set a registration period</0> on the platform.",
      form: {
        registrationUrl: {
          label: "External Registration Link",
          placeholder: "Enter a URL.",
        },
        submit: "Change URL",
        reset: "Discard Changes",
        errors: {
          required: "Please enter a URL.",
          invalidUrl: "The provided URL is invalid.",
        },
        success: "The external registration link was successfully updated.",
      },
    },
  },
  access: {
    headline: "Is this a public or private event?",
    subline: "Control who can attend your event.",
    open: {
      headline: "Public Event",
      subline: "Visible and accessible to all users.",
    },
    closed: {
      headline: "Private Event",
      subline:
        "Accessible by invitation only. This option is not available for external registration.",
    },
  },
  errors: {
    validationError: "An error occurred. Please try again.",
    updateTypeFailed:
      "Updating the registration type failed. Please try again.",
    updateAccessFailed:
      "Updating the registration access setting failed. Please try again.",
    updateRegistrationUrlFailed:
      "Updating the external registration link failed. Please try again.",
    eventPublished:
      "Since your event is already published, you can no longer change the registration type or accessibility.",
  },
} as const;
