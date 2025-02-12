import { assertOrganizationTypeLocales } from "./../../utils";

export const locale = assertOrganizationTypeLocales({
  foundation: {
    title: "Foundation",
    description: null,
  },
  company: {
    title: "Company",
    description: null,
  },
  non_profit_organization: {
    title: "Non-profit organization",
    description: null,
  },
  association: {
    title: "Association",
    description: null,
  },
  educational_institution: {
    title: "Educational institution",
    description: null,
  },
  network: {
    title: "Network",
    description: null,
  },
  initiative: {
    title: "Initiative",
    description: null,
  },
} as const);
