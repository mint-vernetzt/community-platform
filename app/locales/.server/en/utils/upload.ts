export const locale = {
  validation: {
    document: {
      size: "The file must not be larger than {{size}}MB.",
      type: "The file must be a PDF.",
    },
    image: {
      size: "The file must not be larger than {{size}}MB.",
      type: "The file must be a PNG or a JPEG.",
    },
  },
  selection: {
    select: "Choose file",
    empty: "Please choose a file.",
    selected: "Selected {{name}}.",
  },
  success: {
    imageAdded: "{{imageType}} added",
    imageRemoved: "{{imageType}} removed",
    imageTypes: {
      background: "Background image",
      avatar: "Profile picture",
      logo: "Logo",
    },
  },
} as const;
