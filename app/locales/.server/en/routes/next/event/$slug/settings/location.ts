export const locale = {
  stageSelection: {
    headline: "Wie soll das Event stattfinden?",
  },
  stage: "Event type",
  venueName: "Name of the venue",
  venueStreet: "Street and house number",
  venueCity: "City",
  venueZipCode: "Postal code",
  conferenceLink: "Conference link",
  conferenceCode: "Access code for the conference",
  accessibilityInformation: {
    label: "Accessibility information",
    helperText:
      "Is there anything that enables participants with disabilities to access the event, such as sign language interpreters, subtitles, technical support, translation of visual content into spoken content?",
  },
  privacyInformation: {
    label: "Privacy information",
    helperText:
      "Here you can share information about data protection at your event. For example: Will photos be taken? Inform participants how they can visibly opt out (e.g., by wearing a colored wristband). This way, everyone feels well informed – and you contribute to a trustworthy atmosphere.",
  },
  reset: "Discard changes",
  submit: "Save",
  validation: {
    stageRequired: "Please select an event type.",
    stageInvalid: "Please select a valid event type.",
  },
  errors: {
    notFound: "The event was not found.",
    saveFailed:
      "An error occurred while saving the event location settings. Please try again later.",
    coordinatesNotFound:
      'Successfully saved! However, no coordinates could be found for the address entered. Please check your details for spelling mistakes or try adjusting the spelling and address suffix. (Alternatively, check your entries here: <a href="https://nominatim.openstreetmap.org/ui/search.html?street={{street}}&city={{city}}&postalcode={{zipCode}}" target="_blank" rel="noopener noreferrer" class="hover:underline text-primary">https://nominatim.openstreetmap.org/ui/search.html?street={{street}}&city={{city}}&postalcode={{zipCode}})</a>)',
  },
  success: "Event location settings saved successfully.",
} as const;
