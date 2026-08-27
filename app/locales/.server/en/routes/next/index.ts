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
  funding: {
    headline: "Find 4000+ funding opportunities for your work",
    info: "Discover funding opportunities from four databases, find additional funds for your projects and connect with others for joint funding applications.",
    cta: "Find funding",
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
  testimonials: {
    headline: "Voices from the community",
    controls: {
      previous: "Show previous voices",
      next: "Show next voices",
    },
  },
  communityCta: {
    headline: "Actively help shape the platform",
    intro:
      "Your perspective helps to develop the platform further. Contribute your ideas or test new features early. Learn more about planned features and how you can get involved.",
    getInvolved: "Get involved now",
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
