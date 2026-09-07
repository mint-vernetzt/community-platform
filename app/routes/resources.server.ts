import { type languageModuleMap } from "~/locales/.server";

export function getDataForToolsSection() {
  type ResourceKey = keyof (typeof languageModuleMap)[
    "de" | "en"]["resources"]["sections"]["tools"];
  type ResourceListItem = {
    [key in ResourceKey]: {
      link: string;
      imagePath: string;
      blurredImagePath: string;
      external: boolean;
      beta?: boolean;
      bgClassName?: string;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    fundingSearch: {
      link: "/explore/fundings",
      imagePath: "/images/funding-search.png",
      blurredImagePath: "/images/funding-search-blurred.png",
      external: false,
      beta: false,
      bgClassName: "bg-neutral-50",
    },
    sharepic: {
      link: "https://sharepic.mint-vernetzt.de/",
      imagePath: "/images/sharepic-generator.png",
      blurredImagePath: "/images/sharepic-generator-blurred.png",
      external: true,
      beta: true,
      bgClassName: "bg-neutral-100",
    },
    mediaDatabase: {
      link: "https://mediendatenbank.mint-vernetzt.de",
      imagePath: "/images/media-database.png",
      blurredImagePath: "/images/media-database-blurred.png",
      external: true,
      beta: false,
      bgClassName: "bg-neutral-50",
    },
    oeb: {
      link: "https://openbadges.education",
      imagePath: "/images/oeb.png",
      blurredImagePath: "/images/oeb-blurred.png",
      external: true,
    },
  };
  return resourceListItems;
}

export function getDataForInformationSection() {
  type ResourceKey = keyof (typeof languageModuleMap)[
    "de" | "en"]["resources"]["sections"]["information"];
  type ResourceListItem = {
    [key in ResourceKey]: {
      link: string;
      imagePath: string;
      blurredImagePath: string;
      external: boolean;
      beta?: boolean;
      bgClassName?: string;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    mintVernetzt: {
      link: "https://www.mint-vernetzt.de",
      imagePath: "/images/mint-vernetzt.png",
      blurredImagePath: "/images/mint-vernetzt-blurred.png",
      external: true,
      bgClassName: "bg-[#164194]",
    },
    meshMint: {
      link: "https://www.meshmint.org",
      imagePath: "/images/mesh-mint.png",
      blurredImagePath: "/images/mesh-mint-blurred.png",
      external: true,
      bgClassName: "bg-[#0C9C85]",
    },
    mintDataLab: {
      link: "https://datalab.mint-vernetzt.de",
      imagePath: "/images/mint-datalab.png",
      blurredImagePath: "/images/mint-datalab-blurred.png",
      external: true,
      bgClassName: "bg-[#D1A9CC]",
    },
  };
  return resourceListItems;
}

export function getDataForLearnSection() {
  type ResourceKey = keyof (typeof languageModuleMap)[
    "de" | "en"]["resources"]["sections"]["learn"];
  type ResourceListItem = {
    [key in ResourceKey]: {
      link: string;
      imagePath: string;
      blurredImagePath?: string;
      external: boolean;
      beta?: boolean;
      bgClassName?: string;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    mintCampus: {
      link: "https://mintcampus.org",
      imagePath: "/images/mint-campus.png",
      blurredImagePath: "/images/mint-campus-mobile.png",
      external: true,
    },
  };
  return resourceListItems;
}

export function getDataForContributeSection() {
  type ResourceKey = keyof (typeof languageModuleMap)[
    "de" | "en"]["resources"]["sections"]["contribute"];
  type ResourceListItem = {
    [key in ResourceKey]: {
      link: string;
      imagePath: string;
      blurredImagePath: string;
      external: boolean;
      beta?: boolean;
      bgClassName?: string;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    github: {
      link: "https://github.com/mint-vernetzt/community-platform",
      imagePath: "/images/github.png",
      blurredImagePath: "/images/github-blurred.png",
      external: true,
      bgClassName: "bg-neutral-900",
    },
  };
  return resourceListItems;
}
