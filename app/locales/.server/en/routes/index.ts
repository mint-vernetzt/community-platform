export const locale = {
  validation: {
    email: "Please enter a valid email address.",
    password: {
      min: "Your password must be at least 8 characters long.",
      required: "Please enter your password.",
    },
  },
  error: {
    invalidCredentials:
      "Your login credentials (email or password) are incorrect. Please check your entries.",
    notConfirmed:
      'Your email address has not yet been confirmed. That\'s why we have sent you a new confirmation link. Please check your inbox and click on the confirmation link. If you haven\'t received an email, please check your spam folder or contact <a href="mailto:{{supportMail}}" className="mv-text-primary mv-font-bold hover:mv-underline">Support</a>.',
  },
  welcome: "Welcome to Your STEM Community",
  intro:
    "Discover other STEM eduction professionals, organizations, and events on our MINTvernetzt community platform and find inspiration for your work.",
  opportunities:
    "<strong>Create profile pages</strong> for yourself, your <strong>organization</strong>, and create <strong>projects</strong> or <strong>events</strong>.",
  login: {
    skip: {
      start: "Skip login area",
      end: "Back to the start of the login area",
    },
    withMintId: "Log in with MINT-ID",
    moreInformation: "More information",
    or: "or",
    passwordForgotten: "Forgot password?",
    noMember: "Not a member yet?",
    registerByEmail: "Register with email",
    createMintId: "Create MINT-ID",
  },
  form: {
    label: {
      email: "Email *",
      password: "Password *",
      showPassword: "Show password",
      hidePassword: "Hide password",
      submit: "Login",
    },
  },
  content: {
    intro: "To the description of the MINTvernetzt community platform",
    education: {
      headline: "Shaping education together",
      content:
        "Our nationwide STE(A)M community thrives on <0>exchanging ideas, sharing knowledge, and learning from one another</0>. On our community platform, you can <0>connect with each other and with organizations, find inspiration, and locate <1>experts</1></0> on specific topics in your area.",
      action: "Register now",
    },
    growth: {
      headline: "How our community grows",
      profiles: "Persons",
      organizations: "Organizations",
      events: "Events",
      projects: "Projects",
      join: "Become part of our constantly growing STEM community.",
    },
    more: {
      headline: "Learn more",
      content:
        "The MINTvernetzt community platform is a project launched in 2021 to sustainably strengthen the <0>STEM community across Germany</0>. Learn more about <0>MINTvernetzt's initiatives, the service and support centre for STEM professionals</0>, on our website.",
      action: "Visit the MINTvernetzt website",
    },
    faq: {
      headline: "Questions and answers",
      cta: "Complete help section",
      supportQuestion: "Can't find an answer to your question?",
      supportCta: "Feel free to send us an email at:",
      supportEmail: "support@mint-vernetzt.de",
    },
  },
} as const;
