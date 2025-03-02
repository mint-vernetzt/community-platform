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
    onPublishing:
      "Das Projekt konnte nicht veröffentlicht oder versteckt werden. Bitte versuche es erneut oder wende Dich an den Support.",
    onStoring:
      "Das Bild konnte nicht gespeichert werden. Bitte versuche es erneut oder wende Dich an den Support.",
    invalidAction: "Invalid action",
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
    published: "Projekt erfolgreich veröffentlicht",
    hided: "Projekt erfolgreich versteckt",
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
