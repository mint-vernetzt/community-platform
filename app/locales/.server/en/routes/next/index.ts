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
  community: {
    headline: "Our community",
    intro:
      "Exchange that takes you further – with fresh impulses from the community and new perspectives from outside.",
    slideshow: {
      imageAlt: "Photo from the MINTvernetzt community",
      showImage: "Show image {{number}} of {{total}}",
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
      credits: "© Andi Weiland",
    },
  },
  eventTeaser: {
    headline: "Discover STEM events",
    benefits: {
      formats: "Online, on-site or hybrid events",
      knowledge: "Learn new things and share knowledge",
      ownEvents: "Create and manage your own events",
    },
    allEvents: "View all events",
    image: {
      alt: "Two people on stage at a STEM event",
      credits: "© Anti Wieland",
    },
    upcomingEvents: {
      headline: "Upcoming events",
      empty: "There are no upcoming events at the moment.",
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
