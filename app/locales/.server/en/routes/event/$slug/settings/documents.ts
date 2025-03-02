export const locale = {
  error: {
    invalidRoute: "No valid route",
    eventNotFound: "Event not found",
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
    headline: "Manage documents",
    editModal: {
      editDocument: "Edit document",
      title: "Title",
      description: {
        label: "Description",
      },
      submit: "Save",
      reset: "Discard",
    },
    back: "Manage documents",
    description:
      "Add or remove materials such as agendas, maps, checklists to your event.",
    document: {
      upload: "Upload documents",
      type: "File types: PDF. Max {{max}}MB.",
      action: "Upload file",
      added: "Added {{name}}",
      current: "Currently uploaded documents",
      downloadAll: "Download all",
      empty: "No documents available.",
      deleted: "Deleted {{name}}.",
      updated: "Updated {{name}}.",
    },
    form: {
      publish: {
        label: "Veröffentlichen",
      },
      hide: {
        label: "Verstecken",
      },
    },
  },
} as const;
