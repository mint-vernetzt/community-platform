export const locale = {
  name: {
    headline: "Event title",
    label: "Name*",
    helperText:
      "With a maximum of 55 characters in the title, your event can be well displayed in the overview.",
  },
  infos: {
    headline: "Information about your event",
    types: {
      label: "Event type",
      helperText: "Multiple selection is possible.",
      cta: "Please select",
      notFound: "Event type not found",
    },
    subline: {
      label: "Short info",
      helperText:
        "With a maximum of {{max}} characters in the short info, your event can be well displayed in the overview.",
    },
    description: {
      label: "Description",
      helperText:
        "With 400–{{max}} characters, you give your participants a good insight into your event.",
    },
  },
  keywords: {
    headline: "Descriptive keywords",
    tags: {
      label: "Tags",
      helperText: "Multiple selection is possible.",
      cta: "Please select",
      notFound: "Tag not found",
    },
    eventTargetGroups: {
      label:
        "The event is recommended for practitioners from the following educational sectors",
      helperText: "Multiple selection is possible.",
      cta: "Please select",
      notFound: "Target group not found",
    },
    experienceLevels: {
      label: "Experience level",
      cta: "Please select",
      notFound: "Experience level not found",
    },
    focuses: {
      label: "STEM focuses",
      helperText: "Multiple selection is possible.",
      cta: "Please select",
      notFound: "STEM focus not found",
    },
  },
  requiredHint: "*Required information",
  cta: "Save",
  cancel: "Discard changes",
  form: {
    validation: {
      nameRequired: "Please enter a title.",
      nameMinLength: "The event title must be at least 3 characters long.",
      sublineMaxLength:
        "Your entry exceeds the maximum permitted number of characters of {{max}}.",
      descriptionMaxLength:
        "Your entry exceeds the maximum permitted number of characters of {{max}}.",
    },
  },
  errors: {
    saveFailed:
      "An error occurred while saving your changes. Please try again later or contact support.",
  },
  success: "Data saved!",
} as const;
