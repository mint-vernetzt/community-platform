export const locale = {
  error: {
    serverError: "Something went wrong on update.",
    validation: "Validation failed",
    notPrivileged: "Not privileged",
    notFound: {
      organization: "Organization not found",
      named: 'Organization with slug "{{slug}}" not found.',
      visibilities: "Organization visibilities not found.",
    },
  },
  validation: {
    name: {
      required: "Please enter your name.",
    },
    email: {
      email: "Your entry does not match the format of an email.",
    },
  },
  content: {
    headline: "Your organization",
    general: {
      headline: "General",
      intro: "How can the community reach you?",
    },
    address: {
      headline: "Address",
    },
    about: {
      headline: "About us",
      intro: "Share more about your organization with the community.",
    },
    websiteAndSocial: {
      headline: "Website and social networks",
      website: {
        headline: "Website",
        intro: "Where can the community learn more about your offerings?",
      },
      social: {
        headline: "Social networks",
        intro: "In which networks is your organization represented?",
      },
    },
    feedback: "Information has been updated.",
  },
  form: {
    name: {
      label: "Name",
    },
    email: {
      label: "Email",
    },
    phone: {
      label: "Phone",
    },
    street: {
      label: "Street name",
    },
    streetNumber: {
      label: "House number",
    },
    zipCode: {
      label: "ZIP code",
    },
    city: {
      label: "City",
    },
    bio: {
      label: "Short description",
    },
    organizationForm: {
      label: "Organization form",
      placeholder: "Add your organization forms.",
    },
    areas: {
      label: "Activity areas",
      placeholder: "Add your activity areas.",
    },
    supportedBy: {
      label: "Sponsored by",
    },
    focuses: {
      label: "Focus areas",
      placeholder: "Add your focus areas.",
    },
    quote: {
      label: "Quote",
    },
    quoteAuthor: {
      label: "Who is the quote from?",
    },
    quoteAuthorInformation: {
      label: "Additional information of the quote author (Position/Profession)",
    },
    website: {
      label: "Website",
      placeholder: "domainname.tld",
    },
    reset: {
      label: "Discard changes",
    },
    submit: {
      label: "Save",
    },
  },
} as const;
