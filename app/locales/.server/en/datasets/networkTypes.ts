import { assertNetworkTypeLocales } from "./../../utils";

export const locale = assertNetworkTypeLocales({
  alliance: {
    title: "Alliance",
    description: null,
  },
  "mint-cluster": {
    title: "MINT-Cluster",
    description: null,
  },
  "mint-region": {
    title: "MINT-Region",
    description: null,
  },
  "national-initiative": {
    title: "National initiative",
    description: null,
  },
  "other-network": {
    title: "Other network",
    description: null,
  },
} as const);
