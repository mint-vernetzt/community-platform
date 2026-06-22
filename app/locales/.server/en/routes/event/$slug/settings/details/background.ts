export const locale = {
  title: "Change Background Image",
  fileExplanation: "Possible file formats: JPG, PNG (maximum {{size}} MB)",
  aspectExplanation:
    "Aspect ratio: Landscape ({{aspectRatio}}), recommended minimum width {{minWidth}} px",
  currentBackground: {
    title: "Current Background Image",
    remove: "Remove background image",
  },
  changeBackground: {
    pick: "Select file",
    crop: {
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      move: "Move",
      confirm: "Confirm crop",
      edit: "Edit crop",
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
  validation: {
    maxSize: "Your image is too large ({{size}} MB).",
    invalidType: "The file must be a JPG or PNG.",
    descriptionTooLong:
      "The image description must be at most {{max}} characters long.",
    creditsTooLong: "The credits must be at most {{max}} characters long.",
  },
  errors: {
    uploadImageFailed: "The image upload failed.",
    removeImageFailed: "The image removal failed.",
  },
  success: {
    imageAdded: "Background image saved.",
    imageRemoved: "Background image removed.",
  },
} as const;
