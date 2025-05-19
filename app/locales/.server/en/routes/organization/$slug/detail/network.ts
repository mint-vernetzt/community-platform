export const locale = {
  server: {
    error: {
      organizationNotFound: "Organization not found",
    },
  },
  headlines: {
    memberOf: {
      alliance_one: "{{networkName}} is part of the alliance",
      alliance_other: "{{networkName}} is part of the alliances",
      "mint-cluster_one": "{{networkName}} is part of the MINT cluster",
      "mint-cluster_other": "{{networkName}} is part of the MINT clusters",
      "mint-region_one": "{{networkName}} is part of the MINT region",
      "mint-region_other": "{{networkName}} is part of the MINT regions",
      "national-initiative_one":
        "{{networkName}} is part of the national initiative",
      "national-initiative_other":
        "{{networkName}} is part of the national initiatives",
      "other-network_one": "{{networkName}} is part of the other network",
      "other-network_other": "{{networkName}} is part of other networks",
    },
    networkMembers_one: "member of {{networkName}}",
    networkMembers_other: "members {{networkName}}",
  },
} as const;
