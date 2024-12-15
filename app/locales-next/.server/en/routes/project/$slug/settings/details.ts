export const locale = {
  error: {
    notFound: "Not Found",
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    storage:
      "The data could not be saved. Please try again or contact the support team.",
  },
  validation: {
    targetGroupAdditions: {
      max: "Your entry exceeds the maximum permitted number of characters of 200.",
    },
    excerpt: {
      max: "Your entry exceeds the maximum permitted number of characters of 250.",
    },
    idea: {
      message:
        "Your entry exceeds the maximum permitted number of characters of 2000.",
    },
    goals: {
      message:
        "Your entry exceeds the maximum permitted number of characters of 2000.",
    },
    implementation: {
      message:
        "Your entry exceeds the maximum permitted number of characters of 2000.",
    },
    furtherDescription: {
      message:
        "Your entry exceeds the maximum permitted number of characters of 8000.",
    },
    targeting: {
      message:
        "Your entry exceeds the maximum permitted number of characters of 800.",
    },
    hints: {
      message:
        "Your entry exceeds the maximum permitted number of characters of 800.",
    },
    videoSubline: {
      max: "Your entry exceeds the maximum permitted number of characters of 80.",
    },
    custom: {
      message:
        "Additional disciplines can only be selected if at least one main discipline has been selected.",
    },
  },
  content: {
    feedback: "Data saved!",
    nonPersistent:
      "You have unsaved changes. These will be lost if you go one step further now.",
    back: "Project details",
    description:
      "Tell the community more about your project or educational offering.",
    disciplines: {
      headline: "STEM disciplines",
      intro: "Which STEM disciplines play a role in your project?",
      helper: "Multiple entries are possible.",
      choose: "Please select",
    },
    additionalDisciplines: {
      headline:
        "Which additional STEM+ disciplines play a role in your project?",
      helper: "Multiple entries are possible.",
      choose: "Please select",
    },
    furtherDisciplines: {
      headline:
        "Which other sub-disciplines (or techniques, procedures) play a role?",
      helper: "Please add the terms individually.",
      choose: "Add",
    },
    participants: {
      headline: "Participants",
      intro:
        "If your project is designed for a specific number of participants, for example per course, please indicate this.",
      helper: "Here you can enter numbers but also additional information.",
    },
    projectTargetGroups: {
      intro: "Which target groups does the project address?",
      helper: "Multiple entries are possible.",
      choose: "Please select",
    },
    specialTargetGroups: {
      intro:
        "Is a specific (gender, social, cultural or demographic, etc.) group within the target group addressed?",
      helper: "Multiple entries are possible.",
      choose: "Please select",
    },
    targetGroupAdditions: {
      more: "Additional information",
    },
    shortDescription: {
      headline: "Short text about your project",
      intro:
        "Summarize your project in one sentence. This text is displayed as a teaser.",
      label: "Short description",
    },
    extendedDescription: {
      headline: "Detailed description",
      intro:
        "Use the provided fields for your descriptions or structure your project description with the help of self-selected headings in the “Other” field.",
      idea: {
        label: "Idea",
        helper: "Describe the idea behind your project.",
      },
      goals: {
        label: "Goals",
        helper: "Describe learning goals or possible outcomes.",
      },
      implementation: {
        label: "Implementation",
        helper: "What steps are taken?",
      },
      furtherDescription: {
        label: "Other",
        helper:
          "What else would you like to share with the community? Use this field to structure your project description yourself with headings.",
      },
      targeting: {
        label: "How is the target group reached?",
        helper:
          "What measures are being implemented to address the target group? What is being advertised? Are there any other benefits besides what they can learn?",
      },
      hints: {
        label: "Tips for imitation",
        helper:
          "What advice can you give to actors who want to set up a similar project? What to pay attention to?",
      },
    },
    video: {
      headline: "Video link to your project",
      video: {
        label: "Embed link",
        helper:
          "Copy the YouTube URL of your video from the address bar of the browser, use the share function or the embed link from YouTube.",
      },
      videoSubline: {
        label: "Please enter a caption for your video here.",
      },
    },
    reset: "Discard changes",
    submit: "Save",
    error: {
      additionalDisciplines: "Additional disciplines: {{list}}",
      idea: "Detailed description - Idea: {{list}}",
      goals: "Detailed description - Goals: {{list}}",
      implementation: "Detailed description - Implementation: {{list}}",
      furtherDescription: "Detailed description - Other: {{list}}",
      targeting: "Detailed description - Targeting: {{list}}",
      hints: "Detailed description - Tips for imitation: {{list}}",
    },
  },
} as const;
