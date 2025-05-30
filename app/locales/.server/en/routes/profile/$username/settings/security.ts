export const locale = {
  validation: {
    email: {
      min: "Please enter a valid email address.",
      email: "Please enter a valid email address.",
    },
    confirmEmail: {
      min: "Please enter a valid email address.",
      email: "Please enter a valid email address.",
    },
    password: {
      min: "Your password must be at least 8 characters long.",
    },
    confirmPassword: {
      min: "Your password must be at least 8 characters long.",
    },
  },
  error: {
    emailsDontMatch: "Your emails do not match.",
    notPrivileged: "Not privileged",
    notAllowed: "Not allowed.",
  },
  content: {
    headline: "Login and security",
  },
  section: {
    changePassword1: {
      headline: "Change password or email address",
      intro:
        "You use the MINT-ID and can therefore only change your email address and password at <0>mint-id.org</0>.",
    },
    changePassword2: {
      headline: "Change password",
      feedback: "Your password has been changed.",
      intro:
        "Here you can change your password. It must be at least 8 characters long. Use numbers and symbols to make it more secure.",
      form: {
        password: {
          label: "New password",
        },
        confirmPassword: {
          label: "Repeat password",
        },
        submit: {
          label: "Change password",
        },
      },
    },
    changeEmail: {
      headline: "Change email",
      feedback: "A confirmation link has been sent to you.",
      intro:
        "Here you can change your email address for logging in on the community platform.",
      form: {
        email: {
          label: "New email",
        },
        confirmEmail: {
          label: "Repeat email",
        },
        submit: {
          label: "Change email",
        },
      },
    },
  },
} as const;
