export const locale = {
  title: "Upload Documents",
  explanation: "Possible file formats: PDF (maximum {{size}} MB)",
  help: "Help for creating accessible documents can be found in our <0>Help Center</0>.",
  add: {
    pick: "Select file",
    list: {
      more: "{{count}} more",
      less: "{{count}} less",
    },
    clearFileInput: "Reset file selection",
    title: {
      label: "Title",
      helperText:
        "Write how your document should be displayed when downloaded.",
    },
    description: {
      label: "Description",
      helperText:
        "If it is not clear from the document's title, write a short info about what it is.",
    },
    upload: "Upload file",
    cancel: "Cancel",
  },
  validation: {
    maxSize: "The file must not be larger than {{size}}MB.",
    invalidType: "The file must be a PDF.",
    descriptionTooLong:
      "The description must be at most {{max}} characters long.",
  },
  errors: {
    uploadDocumentFailed: "Failed to upload the document.",
  },
  success: {
    documentAdded: "{{name}} added",
  },
} as const;
