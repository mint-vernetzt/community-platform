import { type ExplicitDataset } from "./../../../prisma/scripts/import-datasets";
import { type ArrayElement } from "./../../lib/utils/types";

// Dataset locale types

type AdditionalDisciplineLocales = {
  [key in ArrayElement<ExplicitDataset<"additionalDisciplines">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertAdditionalDisciplineLocales<
  T extends AdditionalDisciplineLocales
>(obj: T): T {
  return obj;
}

type DisciplineLocales = {
  [key in ArrayElement<ExplicitDataset<"disciplines">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertDisciplineLocales<T extends DisciplineLocales>(
  obj: T
): T {
  return obj;
}

type EventAbuseReportReasonSuggestionLocales = {
  [key in ArrayElement<
    ExplicitDataset<"eventAbuseReportReasonSuggestions">
  >["slug"]]: {
    description: string;
  };
};

export function assertEventAbuseReportReasonSuggestionLocales<
  T extends EventAbuseReportReasonSuggestionLocales
>(obj: T): T {
  return obj;
}

type EventTargetGroupLocales = {
  [key in ArrayElement<ExplicitDataset<"eventTargetGroups">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertEventTargetGroupLocales<
  T extends EventTargetGroupLocales
>(obj: T): T {
  return obj;
}

type EventTypeLocales = {
  [key in ArrayElement<ExplicitDataset<"eventTypes">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertEventTypeLocales<T extends EventTypeLocales>(obj: T): T {
  return obj;
}

type ExperienceLevelLocales = {
  [key in ArrayElement<ExplicitDataset<"experienceLevels">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertExperienceLevelLocales<T extends ExperienceLevelLocales>(
  obj: T
): T {
  return obj;
}

type FinancingLocales = {
  [key in ArrayElement<ExplicitDataset<"financings">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertFinancingLocales<T extends FinancingLocales>(obj: T): T {
  return obj;
}

type FocusLocales = {
  [key in ArrayElement<ExplicitDataset<"focuses">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertFocusLocales<T extends FocusLocales>(obj: T): T {
  return obj;
}

type FormatLocales = {
  [key in ArrayElement<ExplicitDataset<"formats">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertFormatLocales<T extends FormatLocales>(obj: T): T {
  return obj;
}

type NetworkTypeLocales = {
  [key in ArrayElement<ExplicitDataset<"networkTypes">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertNetworkTypeLocales<T extends NetworkTypeLocales>(
  obj: T
): T {
  return obj;
}

type OfferLocales = {
  [key in ArrayElement<ExplicitDataset<"offers">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertOfferLocales<T extends OfferLocales>(obj: T): T {
  return obj;
}

type OrganizationTypeLocales = {
  [key in ArrayElement<ExplicitDataset<"organizationTypes">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertOrganizationTypeLocales<
  T extends OrganizationTypeLocales
>(obj: T): T {
  return obj;
}

type ProjectTargetGroupLocales = {
  [key in ArrayElement<ExplicitDataset<"projectTargetGroups">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertProjectTargetGroupLocales<
  T extends ProjectTargetGroupLocales
>(obj: T): T {
  return obj;
}

type SpecialTargetGroupLocales = {
  [key in ArrayElement<ExplicitDataset<"specialTargetGroups">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertSpecialTargetGroupLocales<
  T extends SpecialTargetGroupLocales
>(obj: T): T {
  return obj;
}

type StageLocales = {
  [key in ArrayElement<ExplicitDataset<"stages">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertStageLocales<T extends StageLocales>(obj: T): T {
  return obj;
}

type TagLocales = {
  [key in ArrayElement<ExplicitDataset<"tags">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export function assertTagLocales<T extends TagLocales>(obj: T): T {
  return obj;
}
