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
      required: "Bitte gib Euren Namen ein.",
    },
    email: {
      email: "Deine Eingabe entspricht nicht dem Format einer E-Mail.",
    },
  },
  content: {
    headline: "Deine Organisation",
    general: {
      headline: "Allgemein",
      intro: "Wie kann die Community Euch erreichen?",
    },
    address: {
      headline: "Anschrift",
    },
    about: {
      headline: "Über uns",
      intro: "Teile der Community mehr über Deine Organisation mit.",
    },
    websiteAndSocial: {
      headline: "Website und Soziale Netzwerke",
      website: {
        headline: "Website",
        intro: "Wo kann die Community mehr über Euer Angebot erfahren?",
      },
      social: {
        headline: "Soziale Netzwerke",
        intro: "In welchen Netzwerken ist Deine Organisation vertreten?",
      },
    },
    feedback: "Informationen wurden aktualisiert.",
  },
  form: {
    name: {
      label: "Name",
    },
    email: {
      label: "E-Mail",
    },
    phone: {
      label: "Telefon",
    },
    street: {
      label: "Straßenname",
    },
    streetNumber: {
      label: "Hausnummer",
    },
    zipCode: {
      label: "PLZ",
    },
    city: {
      label: "Stadt",
    },
    bio: {
      label: "Kurzbeschreibung",
    },
    organizationForm: {
      label: "Organisationsform",
      placeholder: "Füge Eure Organisationsformen hinzu.",
    },
    areas: {
      label: "Aktivitätsgebiete",
      placeholder: "Füge Eure Aktivitätsgebiete hinzu.",
    },
    supportedBy: {
      label: "Gefördert von",
    },
    focuses: {
      label: "Schwerpunkte",
      placeholder: "Füge Eure Schwerpunkte hinzu.",
    },
    quote: {
      label: "Zitat",
    },
    quoteAuthor: {
      label: "Von wem stammt das Zitat?",
    },
    quoteAuthorInformation: {
      label: "Zusatzinformationen des Zitatautors (Position/Beruf)",
    },
    website: {
      label: "Website",
      placeholder: "domainname.tld",
    },
    reset: {
      label: "Änderungen verwerfen",
    },
    submit: {
      label: "Speichern",
    },
  },
} as const;
