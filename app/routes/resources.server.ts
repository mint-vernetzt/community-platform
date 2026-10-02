import { type languageModuleMap } from "~/locales/.server";
import mintDataLabImage from "~/assets/resources/mint-datalab.webp";
import mintDataLabImageBlurred from "~/assets/resources/mint-datalab-blurred.webp";
import mintCampusImage from "~/assets/resources/mint-campus.webp";
import mintCampusImageBlurred from "~/assets/resources/mint-campus-mobile.webp";
import fundingSearchImage from "~/assets/resources/funding-search.webp";
import fundingSearchImageBlurred from "~/assets/resources/funding-search-blurred.webp";
import sharepicGeneratorImage from "~/assets/resources/sharepic-generator.webp";
import sharepicGeneratorImageBlurred from "~/assets/resources/sharepic-generator-blurred.webp";
import mediaDatabaseImage from "~/assets/resources/media-database.webp";
import mediaDatabaseImageBlurred from "~/assets/resources/media-database-blurred.webp";
import oebImage from "~/assets/resources/oeb.webp";
import oebImageBlurred from "~/assets/resources/oeb-blurred.webp";
import githubImage from "~/assets/resources/github.webp";
import githubImageBlurred from "~/assets/resources/github-blurred.webp";
import mintVernetztImage from "~/assets/resources/mint-vernetzt.webp";
import mintVernetztImageBlurred from "~/assets/resources/mint-vernetzt-blurred.webp";
import meshMintImage from "~/assets/resources/mesh-mint.webp";
import meshMintImageBlurred from "~/assets/resources/mesh-mint-blurred.webp";

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
      imagePath: fundingSearchImage,
      blurredImagePath: fundingSearchImageBlurred,
      external: false,
      beta: false,
      bgClassName: "bg-neutral-50",
    },
    sharepic: {
      link: "https://sharepic.mint-vernetzt.de/",
      imagePath: sharepicGeneratorImage,
      blurredImagePath: sharepicGeneratorImageBlurred,
      external: true,
      beta: true,
      bgClassName: "bg-neutral-100",
    },
    mediaDatabase: {
      link: "https://mediendatenbank.mint-vernetzt.de",
      imagePath: mediaDatabaseImage,
      blurredImagePath: mediaDatabaseImageBlurred,
      external: true,
      beta: false,
      bgClassName: "bg-neutral-50",
    },
    oeb: {
      link: "https://openbadges.education",
      imagePath: oebImage,
      blurredImagePath: oebImageBlurred,
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
      imagePath: mintVernetztImage,
      blurredImagePath: mintVernetztImageBlurred,
      external: true,
      bgClassName: "bg-[#164194]",
    },
    meshMint: {
      link: "https://www.meshmint.org",
      imagePath: meshMintImage,
      blurredImagePath: meshMintImageBlurred,
      external: true,
      bgClassName: "bg-[#0C9C85]",
    },
    mintDataLab: {
      link: "https://datalab.mint-vernetzt.de",
      imagePath: mintDataLabImage,
      blurredImagePath: mintDataLabImageBlurred,
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
      imagePath: mintCampusImage,
      blurredImagePath: mintCampusImageBlurred,
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
      imagePath: githubImage,
      blurredImagePath: githubImageBlurred,
      external: true,
      bgClassName: "bg-neutral-900",
    },
  };
  return resourceListItems;
}
