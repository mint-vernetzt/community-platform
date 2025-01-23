import { type ExplicitDataset } from "./../../../prisma/scripts/import-datasets";
import { type ArrayElement } from "./../../lib/utils/types";

// Dataset locale types

export type AdditionalDisciplineLocales = {
  [key in ArrayElement<ExplicitDataset<"additionalDisciplines">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type DisciplineLocales = {
  [key in ArrayElement<ExplicitDataset<"disciplines">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type EventAbuseReportReasonSuggestionLocales = {
  [key in ArrayElement<
    ExplicitDataset<"eventAbuseReportReasonSuggestions">
  >["slug"]]: {
    description: string;
  };
};

export type EventTargetGroupLocales = {
  [key in ArrayElement<ExplicitDataset<"eventTargetGroups">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type EventTypeLocales = {
  [key in ArrayElement<ExplicitDataset<"eventTypes">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type ExperienceLevelLocales = {
  [key in ArrayElement<ExplicitDataset<"experienceLevels">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type FinancingLocales = {
  [key in ArrayElement<ExplicitDataset<"financings">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type FocusLocales = {
  [key in ArrayElement<ExplicitDataset<"focuses">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type FormatLocales = {
  [key in ArrayElement<ExplicitDataset<"formats">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type NetworkTypeLocales = {
  [key in ArrayElement<ExplicitDataset<"networkTypes">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type OfferLocales = {
  [key in ArrayElement<ExplicitDataset<"offers">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type OrganizationTypeLocales = {
  [key in ArrayElement<ExplicitDataset<"organizationTypes">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type ProjectTargetGroupLocales = {
  [key in ArrayElement<ExplicitDataset<"projectTargetGroups">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type SpecialTargetGroupLocales = {
  [key in ArrayElement<ExplicitDataset<"specialTargetGroups">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type StageLocales = {
  [key in ArrayElement<ExplicitDataset<"stages">>["slug"]]: {
    title: string;
    description: string | null;
  };
};

export type TagLocales = {
  [key in ArrayElement<ExplicitDataset<"tags">>["slug"]]: {
    title: string;
    description: string | null;
  };
};
