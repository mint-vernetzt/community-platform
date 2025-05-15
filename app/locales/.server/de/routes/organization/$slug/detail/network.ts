export const locale = {
  server: {
    error: {
      organizationNotFound: "Organisation nicht gefunden",
    },
  },
  headlines: {
    memberOf: {
      alliance_one: "{{networkName}} ist Teil des Bündnisses",
      alliance_other: "{{networkName}} ist Teil der Bündnisse",
      "mint-cluster_one": "{{networkName}} ist Teil des MINT-Clusters",
      "mint-cluster_other": "{{networkName}} ist Teil der MINT-Cluster",
      "mint-region_one": "{{networkName}} ist Teil der MINT-Region",
      "mint-region_other": "{{networkName}} ist Teil der MINT-Regionen",
      "national-initiative_one":
        "{{networkName}} ist Teil der Landesinitiative",
      "national-initiative_other":
        "{{networkName}} ist Teil der Landesinitiativen",
      "other-network_one": "{{networkName}} ist Teil des sonstigen Netzwerks",
      "other-network_other": "{{networkName}} ist Teil sonstiger Netzwerke",
    },
    networkMembers_one: "Mitglied von {{networkName}}",
    networkMembers_other: "Mitglieder von {{networkName}}",
  },
} as const;
