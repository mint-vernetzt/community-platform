export const locale = {
  explanation:
    "Currently, your event can be accessed via the following URL: <0>{{baseURL}}/event/{{slug}}</0>. You can customize or shorten the latter part of the URL (slug) to make the link more user-friendly and easier to share.",
  hint: "<0>Please note</0>: Do <0>not</0> change the URL anymore if you have already shared it, as the event will no longer be accessible via the old URL.",
  label: "URL Slug",
  submit: "Change URL",
  reset: "Discard Changes",
  validation: {
    slug: {
      minLength: "The URL slug must be at least 3 characters long.",
      maxLength: "The URL slug must be at most 50 characters long.",
      pattern:
        "The URL slug may only contain lowercase letters, numbers, hyphens, and underscores.",
      stillExisting:
        "The URL slug {{slug}} is already in use. Please choose a different one.",
    },
  },
  errors: {
    updateFailed:
      "An error occurred while updating the event URL. Please try again.",
  },
  success: "The event URL has been successfully updated.",
} as const;
