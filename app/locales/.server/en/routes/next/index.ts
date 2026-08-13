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
  tools: {
    headline: "Tools for your work",
    slider: {
      previous: "Show previous tools",
      next: "Show more tools",
    },
    fundingSearch: {
      imgAlt: "A piggy bank.",
      headline: "Funding search",
      content:
        "Find suitable funding with our funding search. We search funding databases for relevant keywords and present the results to you in a collected way.",
      action: "To the funding search",
    },
    sharepic: {
      imgAlt: "An image of a young girl with VR glasses.",
      headline: "MINT Sharepic Generator",
      content:
        "Create graphics for your public relations work easily and use your own images in compliance with data protection regulations or access images and graphics from the integrated MINT Media Database.",
      action: "To the MINT Sharepic Generator",
    },
    mediaDatabase: {
      imgAlt: "Four images arranged as tiles with a STEM reference.",
      headline: "MINT Media Database",
      content:
        "Find free STEM images and graphics in our constantly expanding database to make your public relations work appealing and target group-oriented.",
      action: "To the MINT Media Database",
    },
    oeb: {
      imgAlt: "The logo of MINT Open Educational Badges.",
      headline: "MINT Open Educational Badges (OEB)",
      content:
        "Create badges (digital evidence) for your learners in minutes with Open Educational Badges and create more visibility for the quality of your learning opportunities.",
      action: "To MINT-OEB",
    },
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
