export const locale = {
  validation: {
    email: {
      min: "Please enter a valid email address.",
      required: "Please enter a valid email address.",
    },
    confirmEmail: {
      min: "Please enter a valid email address.",
      required: "Please enter a valid email address.",
    },
    password: {
      min: "Your password must be at least 8 characters long.",
      required: "Please enter a password.",
    },
    confirmPassword: {
      min: "Your password must be at least 8 characters long.",
      required: "Please enter the password for confirmation.",
    },
  },
  error: {
    emailsDontMatch: "Your emails do not match.",
    passwordMismatch: "The passwords do not match.",
    notPrivileged: "Not privileged",
    notAllowed: "Not allowed.",
    noStringIntent: "Intent must be a string.",
    wrongIntent: "Wrong intent.",
    updatePasswordFailed: "Failed to update password.",
    emailChangeFailed: "Failed to change email.",
    sendEmailNoticeFailed: "Failed to send email notice.",
    emailAlreadyUsed: "This email address is already in use by another user.",
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
      feedback:
        "Your password has been changed. A notification has been sent to the old email address.",
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
        showPassword: "Show password",
        hidePassword: "Hide password",
      },
      emailNotice: {
        subject: "Your password has been changed",
        headline: "Hello {{firstName}},",
        message:
          "The login data for your MINTvernetzt profile has changed. Your password has been changed. If you did not make this change, please contact support at:",
      },
    },
    changeEmail: {
      headline: "Change email",
      feedback:
        "Email address changed. A notification has been sent to the old email address.",
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
      emailNotice: {
        subject: "Your email address has been changed",
        headline: "Hello {{firstName}},",
        message:
          "The login data for your MINTvernetzt profile has changed. Your email address has been changed from {{oldEmail}} to {{newEmail}}. If you did not make this change, please contact support at:",
      },
    },
  },
} as const;
