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
      'Your email address has not yet been confirmed. That\'s why we have sent you a new confirmation link. Please check your inbox and click on the confirmation link. If you haven\'t received an email, please check your spam folder or contact <a href="mailto:{{supportMail}}" className="text-primary font-bold hover:underline">Support</a>.',
  },
  content: {
    headline: "Strengthening STEM education together",
    intro: "Find people, ideas and support for your work in STEM education.",
  },
  counter: {
    profiles: "Profiles",
    organizations: "Organizations",
    events: "Events",
    projects: "Projects",
  },
  login: {
    skip: {
      start: "Skip login area",
      end: "Back to the start of the login area",
    },
    withMintId: "Log in with MINT-ID",
    moreInformation: "More information",
    or: "or",
    passwordForgotten: "Forgot password",
    noMember: "Not a member yet?",
    registerByEmail: "Register with email",
    createMintId: "Create MINT-ID",
  },
  projectTeaser: {
    headline: "Get inspired by other STEM projects",
    benefits: {
      ideas: "Ideas and good practice from the community",
      cooperations: "Find starting points for cooperations",
      ownProjects: "Make your own projects visible",
      learn: "Learn from the experiences of others",
    },
    allProjects: "View all projects",
    image: {
      alt: "People at an exhibition stand of the project Tinkertank",
      credits: "© Jasmin Mertikat",
    },
  },
  form: {
    label: {
      email: "Email",
      password: "Password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      submit: "Login",
    },
  },
} as const;
