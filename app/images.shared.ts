import defaultEventBackground from "~/assets/default-event-background.webp";
import defaultEventBackgroundBlurred from "~/assets/default-event-background-blurred.webp";
import defaultProjectBackground from "~/assets/default-project-background.webp";
import defaultProjectBackgroundBlurred from "~/assets/default-project-background-blurred.webp";
import defaultOrganizationBackground from "~/assets/default-organization-background.webp";
import defaultOrganizationBackgroundBlurred from "~/assets/default-organization-background-blurred.webp";
import defaultProfileBackground from "~/assets/default-profile-background.webp";
import defaultProfileBackgroundBlurred from "~/assets/default-profile-background-blurred.webp";

export const MaxImageSizes = {
  Background: {
    width: 1488,
    height: 480,
  },
  EventBackground: {
    width: 900,
    height: 600,
  },
  AvatarAndLogo: {
    width: 256,
    height: 256,
  },
};

export const MinCropSizes = {
  Background: {
    width: 124,
    height: 40,
  },
  EventBackground: {
    width: 60,
    height: 40,
  },
  AvatarAndLogo: {
    width: 100,
    height: 100,
  },
};

export const ImageAspects = {
  Background: 31 / 10,
  EventBackground: 3 / 2,
  AvatarAndLogo: 1,
};

export const ImageAspectsAsStrings = {
  Background: "31:10",
  EventBackground: "3:2",
  AvatarAndLogo: "1:1",
};

export const DefaultImages = {
  Event: {
    Background: defaultEventBackground,
    BlurredBackground: defaultEventBackgroundBlurred,
  },
  Project: {
    Background: defaultProjectBackground,
    BlurredBackground: defaultProjectBackgroundBlurred,
  },
  Organization: {
    Background: defaultOrganizationBackground,
    BlurredBackground: defaultOrganizationBackgroundBlurred,
  },
  Profile: {
    Background: defaultProfileBackground,
    BlurredBackground: defaultProfileBackgroundBlurred,
  },
};
