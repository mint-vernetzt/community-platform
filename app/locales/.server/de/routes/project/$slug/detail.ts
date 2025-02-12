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
    back: "Projekte entdecken",
    draft: "Entwurf",
    changeImage: "Logo ändern",
    edit: "Projekt bearbeiten",
    publish: {
      hide: "Verstecken",
      show: "Veröffentlichen",
    },
    about: "Über das Projekt",
    conditions: "Rahmenbedingungen",
    material: "Material",
  },
  cropper: {
    background: {
      headline: "Hintergrundbild",
    },
    logo: {
      headline: "Logo",
    },
  },
} as const;
