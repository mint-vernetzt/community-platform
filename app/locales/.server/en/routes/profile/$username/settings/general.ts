export const locale = {
  error: {
    profileNotFound: "Profile not found.",
    validationFailed: "Validation failed",
    serverError: "Something went wrong on update.",
    notPrivileged: "Not privileged",
    noVisibilities: "Profile visibilities not found.",
  },
  validation: {
    firstName: {
      required: "Please enter your first name.",
    },
    lastName: {
      required: "Please enter your last name.",
    },
  },
  headline: "Personal information",
  general: {
    headline: "General",
    intro:
      "What information would you like to share about yourself with the community? Use the eye icon to choose whether the information is publicly visible to everyone or only shared with registered users.",
    form: {
      title: {
        label: "Title",
        options: {
          dr: "Dr.",
          prof: "Prof.",
          profdr: "Prof. Dr.",
        },
      },
      position: {
        label: "Position",
      },
      firstName: {
        label: "First name",
      },
      lastName: {
        label: "Last name",
      },
      email: {
        label: "Email",
        helperText:
          "The primary email can be changed under <0>Login & Security</0>.",
      },
      email2: {
        label: "Additional email",
      },
      phone: {
        label: "Phone",
      },
    },
  },
  aboutMe: {
    headline: "About me",
    intro:
      "Tell the community about yourself: Who are you and what do you specifically do in the STEM field? In which regions are you primarily active? What competencies do you bring and which topics are you particularly interested in within the STEM context?",
    form: {
      description: {
        label: "Short description",
        placeholder:
          "Describe yourself and your field of activity in more detail.",
      },
      activityAreas: {
        label: "Activity areas",
        placeholder: "Add regions where you are active.",
      },
      skills: {
        label: "Skills",
        placeholder: "Add your skills.",
      },
      interests: {
        label: "Interests",
        placeholder: "Add your interests.",
      },
    },
  },
  offer: {
    headline: "I offer",
    intro:
      "What do you bring that the community can benefit from? How can you support other members?",
    form: {
      quote: {
        label: "Offer",
        placeholder: "Add your offers.",
      },
    },
  },
  lookingFor: {
    headline: "I'm looking for",
    intro: "What are you looking for? How can other members support you?",
    form: {
      seeking: {
        label: "Seeking",
        placeholder: "Add what you are seeking.",
      },
    },
  },
  websiteSocialMedia: {
    headline: "Website and social networks",
    website: {
      headline: "Website",
      intro: "Where can the community learn more about you and your offerings?",
      form: {
        website: {
          label: "Website",
          placeholder: "domainname.tld",
        },
      },
    },
    socialMedia: {
      headline: "Social networks",
      intro: "Where can the community get in touch with you?",
    },
  },
  network: {
    headline: "Add organization or network",
    action: "Create organization",
    intro:
      "The organization or network you are active in does not have a profile yet? Add it directly so that other members can learn about it as well.<br /><br />If the organization already exists, contact the person who created it.<br /><br />In the future, you will be able to add yourself to organizations independently.",
  },
  footer: {
    profileUpdated: "Your profile has been updated.",
    ignoreChanges: "Discard changes",
    save: "Save",
  },
} as const;
