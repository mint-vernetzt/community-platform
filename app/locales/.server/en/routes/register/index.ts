export const locale = {
  content: {
    question: "Already a member?",
    login: "Login",
    create: "Create me as a person",
    success:
      "Your profile for <0>{{email}}</0> has been created. To complete the registration, please confirm the registration link in your emails within one hour. We will send it to you via <0>{{systemMail}}</0>. Please also check your spam folder. If you haven't received the email, please contact our <1>Support</1>. If you have already registered with this email address and have forgotten your password, please reset your password here:",
    reset: "Reset password",
  },
  form: {
    intro:
      "Here you can create your personal profile. The organizations, networks, or companies in which you are active can be added in the next step.",
    title: {
      label: "Title",
      options: {
        none: "No title",
        dr: "Dr.",
        prof: "Prof.",
        profdr: "Prof. Dr.",
      },
      cta: "Select title",
    },
    firstName: "First name *",
    lastName: "Last name *",
    email: "Email *",
    password: {
      label: "Password *",
      showPassword: "Show password",
      hidePassword: "Hide password",
    },
    confirmation:
      "I agree to the <0>Terms of service</0>. I have taken note of the <1>Privacy policy</1>.",
    submit: "Create profile",
  },
  validation: {
    termsAccepted:
      "Please accept our terms of use and confirm that you have read the privacy policy.",
    firstName: "Please enter your first name.",
    lastName: "Please enter your last name.",
    email: "Please enter a valid email address.",
    password: {
      required: "Please enter a password.",
      min: "Your password must be at least 8 characters long. For more security, we recommend using a minimum of 12 characters with uppercase and lowercase letters, numbers, and special characters.",
    },
  },
} as const;
