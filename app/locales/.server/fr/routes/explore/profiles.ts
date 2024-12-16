export const locale = {
  headline: "Découvrez la communauté",
  intro: "Vous trouverez ici les profils des acteurs de la communauté MINT.",
  filter: {
    title: "Filtre",
    showFiltersLabel: "Filtrer les profils",

    activityAreas: "Domaine d'activité",
    lookingFor: "Je cherche",
    support: "Je souhaite soutenir avec",
    offers: "Compétences offertes",
    sort: {
      label: "Trier par",
    },

    areas: "Lieu / Région",
    searchAreaPlaceholder: "Entrez un lieu ou une région",
    searchAreaHelper: "Au moins 3 lettres.",
    searchAreaButton: "Rechercher",
    stateLabel: "Suggestions par région",
    districtLabel: "Suggestions par lieu",
    apply: "Appliquer le filtre",
    reset: "Réinitialiser tout",
    sortBy: {
      label: "Tri",
      "firstName-asc": "Prénom (A-Z)",
      "firstName-desc": "Prénom (Z-A)",
      "lastName-asc": "Nom (A-Z)",
      "lastName-desc": "Nom (Z-A)",
      "createdAt-desc": "Les plus récents d'abord",
    },
  },
  more: "Charger plus",
  empty: "Malheureusement, aucun profil n'a été trouvé.",
  notShown_singular:
    "{{count}} profil ne peut pas être affiché car il a marqué les critères de filtrage spécifiés comme informations privées. Les informations privées ne sont visibles que pour les personnes connectées.",
  notShown_plural:
    "{{count}} profils ne peuvent pas être affichés car ils ont marqué les critères de filtrage spécifiés comme informations privées. Les informations privées ne sont visibles que pour les personnes connectées.",
  itemsCountSuffix_singular: "profil",
  itemsCountSuffix_plural: "profils",
  showNumberOfItems_singular: "Afficher {{count}} profil",
  showNumberOfItems_plural: "Afficher {{count}} profils",
} as const;
