export const locale = {
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    invalidSubmission: "No valid submission",
    invalidAction: "No valid action",
    onStoring: "File could not be saved. Please try again or contact support.",
    onUpdating:
      "File could not be updated. Please try again or contact support.",
  },
  validation: {
    document: {
      description: {
        max: "The document description may be a maximum of {{max}} characters long.",
      },
    },
    image: {
      description: {
        max: "The image description may be a maximum of {{max}} characters long.",
      },
      credits: {
        max: "The creator's name may be a maximum of {{max}} characters long.",
      },
    },
  },
  content: {
    editModal: {
      editDocument: "Edit document",
      editImage: "Edit image",
      title: "Title",
      credits: {
        label: "Credits",
        helper: "Please name the creator of the image here",
      },
      description: {
        label: "Description",
        helper:
          "Help blind people understand what is in the picture with your picture description.",
      },
      submit: "Save",
      reset: "Discard",
    },
    back: "Manage documents",
    description:
      "Add or remove materials such as flyers, images or checklists from your project.",
    document: {
      upload: "Upload documents",
      type: "File types: PDF. Max {{max}}MB.",
      select: "Choose file",
      action: "Upload file",
      selection: {
        empty: "Please choose a file.",
        selected: "Selected {{name}}.",
      },
      added: "Added {{name}}",
      current: "Currently uploaded documents",
      downloadAll: "Download all",
      empty: "No documents available.",
      deleted: "Deleted {{name}}.",
      updated: "Updated {{name}}.",
    },
    image: {
      upload: "Upload image",
      requirements: "File types: jpg, png. Max 6MB.",
      select: "Choose file",
      action: "Upload file",
      selection: {
        empty: "Please choose a file.",
        selected: "Selected {{name}}.",
      },
      added: "Added {{name}}",
      current: "Currently uploaded images",
      downloadAll: "Download all",
      empty: "No images available.",
      deleted: "Deleted {{name}}.",
      updated: "Updated {{name}}.",
    },
  },
} as const;
