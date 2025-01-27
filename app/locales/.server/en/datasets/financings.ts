import { assertFinancingLocales } from "./../../utils";

export const locale = assertFinancingLocales({
  public_funding_eu: {
    title: "Public Funding (EU)",
    description: null,
  },
  public_funding_de: {
    title: "Public Funding (DE)",
    description: null,
  },
  private_funding_companies: {
    title: "Private Funding (Companies)",
    description: null,
  },
  private_funding_foundations: {
    title: "Private Funding (Foundations)",
    description: null,
  },
  private_funding_individuals: {
    title: "Private Funding (Individuals)",
    description: null,
  },
  private_funding_social_lottery: {
    title: "Private Funding (Social Lotteries)",
    description: null,
  },
  self_funding: {
    title: "Self-financing",
    description: null,
  },
  crowdfunding: {
    title: "Crowdfunding",
    description: null,
  },
  other: {
    title: "Other",
    description: null,
  },
} as const);
