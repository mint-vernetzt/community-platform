export const locale = {
  title: "Change Background Image",
  fileExplanation: "Possible file formats: JPG, PNG (maximum {{size}} MB)",
  aspectExplanation:
    "Aspect ratio: Landscape ({{aspectRatio}}), recommended minimum width {{minWidth}} px",
  currentBackground: {
    title: "Current Background Image",
  },
  changeBackground: {
    pick: "Select file",
    crop: {
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      move: "Move",
    },
    description: {
      label: "Image description",
      placeholder: "Briefly describe your image.",
      helperText:
        "Your description helps visually impaired people understand your image.",
    },
    credits: {
      label: "Credits",
      placeholder: "Specify who created your image.",
      helperText: "Name the creator(s) of the image.",
    },
    submit: "Save changes",
    discard: "Discard changes",
  },
  toMediaDatabase: {
    hint: "Tip: Select an image from the MINT media database, download it, and insert it here.",
    cta: "To the MINT media database",
  },
} as const;
