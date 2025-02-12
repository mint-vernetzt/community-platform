export const locale = {
  validation: {
    document: {
      size: "The file exceeds the maximum size of 6MB.",
      type: "The file is not of type PDF or JPEG.",
    },
    image: {
      size: "The file exceeds the maximum size of 6MB.",
      type: "The file is not of type PDF or JPEG.",
    },
  },
  error: {
    invalidRoute: "No valid route",
    projectNotFound: "Project not found",
    invalidSubmission: "No valid submission",
    invalidAction: "No valid action",
    onStoring: "Error on storing document",
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
      upload: "Upload document",
      type: "File types: PDF, jpg. Max 6MB.",
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
    },
  },
} as const;
