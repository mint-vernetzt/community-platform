import { locale as helpLocale } from "../../help";

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
    intro: "Find people, ideas, and support for your work in STEM education.",
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
    items: {
      sharepic: {
        imgAlt: "Screenshot of the Sharepic generator",
        headline: "Sharepic generator",
        content:
          "Create graphics for your public relations work and use your own images in compliance with data protection regulations or access images and graphics from the integrated STEM media database.",
        action: "To the Sharepic generator",
      },
      map: {
        imgAlt: "Screenshot of the STEM community map",
        headline: "STEM community map",
        content:
          "Use the map to find STEM organizations in your area. Easily embed the map on your website.",
        action: "Explore the STEM map",
      },
      mediaDatabase: {
        imgAlt: "Screenshot of the STEM media database",
        headline: "STEM media database",
        content:
          "Find STEM images and graphics for your STEM communication: diverse, diversity-sensitive, and free of charge.",
        action: "To the STEM media database",
      },
      fundings: {
        imgAlt: "A piggy bank",
        headline: "Funding search",
        content:
          "Bundled funding search – discover suitable programs and find new financing opportunities for your work.",
        action: "To the funding search",
      },
    },
  },
  community: {
    headline: "Our community",
    intro:
      "Exchange that takes you further – with fresh impulses from the community and new perspectives from outside.",
    slideshow: {
      showImage: "Show image {{number}} of {{total}}",
    },
    items: {
      mvAnnualMeeting: {
        imgAlt:
          "The annual meeting of the MINTvernetzt community - MINTvernetzt Jahrestagung",
        credit: "© Mark Bollhorst",
      },
      thinkathon24: {
        imgAlt:
          "The 2024 MINTvernetzt thinkathon event of the MINTvernetzt community",
        credit: "© Heike Fischer Fotografie",
      },
      thinkathon22: {
        imgAlt:
          "The 2022 MINTvernetzt thinkathon event of the MINTvernetzt community",
        credit: "© Andi Weiland",
      },
      thinkathon22_2: {
        imgAlt:
          "The 2022 MINTvernetzt thinkathon event of the MINTvernetzt community - part 2",
        credit: "© Andi Weiland",
      },
      designBasedLearning: {
        imgAlt:
          "The 2025 MINTvernetzt design-based learning workshop for the MINTvernetzt community",
        credit: "© Beatrice Barth",
      },
      thinkathon24_2: {
        imgAlt:
          "The 2024 MINTvernetzt thinkathon event of the MINTvernetzt community - part 2",
        credit: "© Heike Fischer Fotografie",
      },
      thinkathon22_3: {
        imgAlt:
          "The 2022 MINTvernetzt thinkathon event of the MINTvernetzt community - part 3",
        credit: "© Andi Weiland",
      },
      thinkathon22_4: {
        imgAlt:
          "The 2022 MINTvernetzt thinkathon event of the MINTvernetzt community - part 4",
        credit: "© Andi Weiland",
      },
      designBasedLearning_2: {
        imgAlt:
          "The 2025 MINTvernetzt design-based learning workshop for the MINTvernetzt community - part 2",
        credit: "© Beatrice Barth",
      },
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
      credits: "© Andi Weiland",
    },
    upcomingEvents: {
      headline: "Upcoming events",
      empty: "There are no upcoming events at the moment.",
    },
    waitinglist: "Waiting list places",
    seatsFree: "Free seats",
    unlimitedSeats: "Unlimited seats",
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
  about: {
    headline: "Who is behind the platform",
    description:
      "The MINTvernetzt community platform is a project by MINTvernetzt. MINTvernetzt is the central point of contact for extracurricular STEM education in Germany. We are funded by the Federal Ministry of Education, Family Affairs, Senior Citizens, Women and Youth.",
    moreInformation:
      "Learn more about MINTvernetzt and other projects on our website.",
    website: "MINTvernetzt website",
    image: {
      alt: "The MINTvernetzt team standing on a spiral staircase",
      credits: "© Mark Bollhorst",
    },
  },
  faq: {
    headline: "Questions and answers",
    cta: "Complete help section",
    qAndAs: {
      whatIsStem: helpLocale.faq.stemEducation.qAndAs.whatIsStem,
      whoIsThePlatformFor:
        helpLocale.faq.generalPlatformInformation.qAndAs.whoIsThePlatformFor,
      benefitsOfThePlatform:
        helpLocale.faq.generalPlatformInformation.qAndAs.benefitsOfThePlatform,
      isItFree: helpLocale.faq.generalPlatformInformation.qAndAs.isItFree,
      benefitsOfRegistration:
        helpLocale.faq.registration.qAndAs.benefitsOfRegistration,
      mintId: helpLocale.faq.registration.qAndAs.mintId,
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
