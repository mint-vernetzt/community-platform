export const locale = {
  title: "Currently Uploaded Documents",
  list: {
    more: "{{count}} more",
    less: "{{count}} less",
    searchPlaceholder: "Search documents...",
    remove: "Remove",
    edit: "Edit",
    editModal: {
      headline: "Edit Document",
      title: {
        label: "Title",
        helperText:
          "Write how your document should be displayed when downloaded.",
      },
      description: {
        label: "Document Description",
        helperText:
          "If it's not clear from the document title, write a short info about what it is.",
      },
      submit: "Save",
      close: "Discard",
    },
    download: "Download",
    downloadAll: "Download all",
    overlayMenu: "Close",
  },
  validation: {
    edit: {
      descriptionTooLong:
        "The description can be at most {{max}} characters long.",
    },
  },
  errors: {
    removeDocumentFailed: "Failed to remove the document.",
    updateDocumentFailed: "Failed to update the document.",
  },
  success: {
    removeDocument: "The document was successfully removed.",
    updateDocument: "The document was successfully updated.",
  },
} as const;
