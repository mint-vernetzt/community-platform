export const locale = {
  error: {
    invariant: {
      undefinedSlug: 'Route parameter "slug" not found',
      adminsOnly: "Only admins can publish a project",
      missingConfirmation: "Did not provide an conform.INTENT",
      invalidIntent: "The intent value you provided is not a string",
      projectNotFound: "Project not found",
      projectNotPublished: "This project isn't published yet.",
    },
  },
  content: {
    back: "Explore projects",
    draft: "Draft",
    changeImage: "Change logo",
    edit: "Edit project",
    publish: {
      hide: "Hide",
      show: "Publish",
    },
    about: "About the project",
    conditions: "Framework conditions",
    material: "Documents",
  },
  cropper: {
    background: {
      headline: "Background image",
    },
    logo: {
      headline: "Logo",
    },
  },
} as const;
