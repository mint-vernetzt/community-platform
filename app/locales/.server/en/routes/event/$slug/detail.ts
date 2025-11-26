export const locale = {
  content: {
    back: "Explore events",
    jointEvent: "Joint event",
    unlimitedSeats: "Unlimited seats",
    seatsFree: "seats free",
    waitingListAvailable: "Seats on waiting list available",
    copy: "Copy URL",
    copied: "URL copied!",
    onSite: "on site",
    online: "Online Event",
    hybrid: "Hybrid Event",
    details: "Event details",
    participants: "Participants",
    childEvents: "Child events",
    inPast: "Event has already taken place",
    beforeParticipationPeriod:
      "Registration period starts on {{date}} at {{time}}",
    afterParticipationPeriod: "Registration period has ended",
    draft: "Draft",
    canceled: "Event canceled",
    edit: "Edit event",
    login: "Log in to participate",
    participate: "Participate",
    withdrawParticipation: "Withdraw participation",
    joinWaitingList: "Join waiting list",
    leaveWaitingList: "Leave waiting list",
    report: "Report",
    reported: "Report is being reviewed",
    reportFaq: "More info about reporting",
    changeBackground: "Change background",
    overlayMenu: {
      close: "Close",
    },
  },
  errors: {
    invalidProfileId: "Invalid profile ID",
    participate: "Error adding to participants",
    withdrawParticipation: "Error removing from participants",
    joinWaitingList: "Error adding to waiting list",
    leaveWaitingList: "Error removing from waiting list",
    abuseReport: {
      reasons: {
        required: "Please give a reason.",
      },
      submit: "Error submitting the report",
    },
    background: {
      upload:
        "The image could not be saved. Please try again or contact support.",
      disconnect:
        "The background image could not be removed. Please try again or contact support.",
    },
  },
  success: {
    participate: "Successfully added to participants",
    withdrawParticipation: "Successfully removed from participants",
    joinWaitingList: "Successfully joined waiting list",
    leaveWaitingList: "Successfully left waiting list",
    abuseReport: "The abuse report was successfully submitted.",
  },
  abuseReport: {
    title: "Why do you want to report this event?",
    description:
      "In order to follow up on your report, we need the reason why you want to report this event.",
    faq: 'Further information about the reporting process can be found in our <a href="/help#events-reportEvent" target="_blank" class="text-primary underline hover:no-underline">help section</a>.',
    otherReason: "Other reason",
    noReasons: "Please give at least one reason.",
    alreadySubmitted: "You have already reported this event.",
    maxLength: "Maximum {{max}} characters",
    submit: "Report event",
    abort: "Cancel",
    email: {
      subject: 'Profile "{{username}}" reported event "{{slug}}"',
    },
  },
  changeBackground: {
    title: "Change background image",
    alt: "Background image for event {{eventName}}",
    upload: {
      validation: {
        image: {
          size: "The image file is too large. Maximum allowed size is {{maxSize}} MB.",
          type: "The image file has an invalid format. Allowed formats are: {{allowedFormats}}.",
        },
      },
      selection: {
        select: "Select image",
        empty: "No image selected",
      },
    },
    imageCropper: {
      imageCropper: {
        error: "Error cropping image",
        confirmation: "Image cropped successfully",
        disconnect: "Disconnected from image editing service",
        reset: "Reset",
        submit: "Crop image",
      },
    },
    success: {
      imageAdded: "{{imageType}} added",
      imageRemoved: "{{imageType}} removed",
      imageTypes: {
        background: "Background image",
        avatar: "Profile picture",
        logo: "Logo",
      },
    },
  },
} as const;
