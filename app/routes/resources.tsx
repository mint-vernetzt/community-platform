import { detectLanguage } from "./../i18n.server";
import type { Route } from "./+types/resources";
import { languageModuleMap } from "./../locales/.server";
import { Link } from "react-router";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["resources"];
  return {
    locales,
  };
};

function getDataForToolsSection() {
  type ResourceKey =
    keyof Route.ComponentProps["loaderData"]["locales"]["sections"]["tools"];
  type ResourceListItem = {
    [key in ResourceKey]: {
      link: string;
      imagePath: string;
      external: boolean;
      beta?: boolean;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    mediaDatabase: {
      link: "https://mediendatenbank.mint-vernetzt.de",
      imagePath: "/images/media-database.png",
      external: true,
      beta: true,
    },
    sharepic: {
      link: "https://mint.sharepicgenerator.de",
      imagePath: "/images/sharepic-generator.png",
      external: true,
      beta: true,
    },
    fundingSearch: {
      link: "/explore/fundings",
      imagePath: "/images/funding-search.png",
      external: false,
      beta: true,
    },
    oeb: {
      link: "https://openbadges.education",
      imagePath: "/images/oeb.png",
      external: true,
    },
  };
  return resourceListItems;
}

function getDataForInformationSection() {
  type ResourceKey =
    keyof Route.ComponentProps["loaderData"]["locales"]["sections"]["information"];
  type ResourceListItem = {
    [key in ResourceKey]: {
      link: string;
      imagePath: string;
      external: boolean;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    mintVernetzt: {
      link: "https://www.mint-vernetzt.de",
      imagePath: "/images/mint-vernetzt.png",
      external: true,
    },
    meshMint: {
      link: "https://www.meshmint.org",
      imagePath: "/images/mesh-mint.png",
      external: true,
    },
    mintDataLab: {
      link: "https://datalab.mint-vernetzt.de",
      imagePath: "/images/mint-datalab.png",
      external: true,
    },
  };
  return resourceListItems;
}

function getDataForLearnSection() {
  type ResourceKey =
    keyof Route.ComponentProps["loaderData"]["locales"]["sections"]["learn"];
  type ResourceListItem = {
    [key in ResourceKey]: {
      link: string;
      imagePath: string;
      external: boolean;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    mintCampus: {
      link: "https://mintcampus.org",
      imagePath: "/images/mint-campus.png",
      external: true,
    },
  };
  return resourceListItems;
}

function getDataForContributeSection() {
  type ResourceKey =
    keyof Route.ComponentProps["loaderData"]["locales"]["sections"]["contribute"];
  type ResourceListItem = {
    [key in ResourceKey]: {
      link: string;
      imagePath: string;
      external: boolean;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    github: {
      link: "https://github.com/mint-vernetzt/community-platform",
      imagePath: "/images/github.png",
      external: true,
    },
  };
  return resourceListItems;
}

export default function Resources({ loaderData }: Route.ComponentProps) {
  const { locales } = loaderData;
  const toolsSectionData = getDataForToolsSection();
  const informationSectionData = getDataForInformationSection();
  const learnSectionData = getDataForLearnSection();
  const contributeSectionData = getDataForContributeSection();

  return (
    <>
      <h1>{locales.headline}</h1>
      <p>{locales.subline}</p>
      <h2>{locales.sections.tools.headline}</h2>
      {Object.keys(toolsSectionData).map((resourceKey) => {
        const typedResourceKey = resourceKey as keyof typeof toolsSectionData;
        const typedResourceValue = toolsSectionData[typedResourceKey];
        return (
          <>
            <img
              src={typedResourceValue.imagePath}
              alt={locales.sections.tools[typedResourceKey].imgAlt}
            />
            <h3>{locales.sections.tools[typedResourceKey].headline}</h3>
            {typedResourceValue.beta ? <p>Beta</p> : null}
            <p>{locales.sections.tools[typedResourceKey].content}</p>
            <Link
              to={typedResourceValue.link}
              rel={
                typedResourceValue.external === true
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {locales.sections.tools[typedResourceKey].action}
            </Link>
            {typedResourceKey === "sharepic" ? (
              <p>{locales.sections.tools[typedResourceKey].desktopOnly}</p>
            ) : null}
          </>
        );
      })}
      <h2>{locales.sections.information.headline}</h2>
      {Object.keys(informationSectionData).map((resourceKey) => {
        const typedResourceKey =
          resourceKey as keyof typeof informationSectionData;
        const typedResourceValue = informationSectionData[typedResourceKey];
        return (
          <>
            <img
              src={typedResourceValue.imagePath}
              alt={locales.sections.information[typedResourceKey].imgAlt}
            />
            <h3>{locales.sections.information[typedResourceKey].headline}</h3>
            <p>{locales.sections.information[typedResourceKey].content}</p>
            <Link
              to={typedResourceValue.link}
              rel={
                typedResourceValue.external === true
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {locales.sections.information[typedResourceKey].action}
            </Link>
          </>
        );
      })}
      <h2>{locales.sections.learn.headline}</h2>
      {Object.keys(learnSectionData).map((resourceKey) => {
        const typedResourceKey = resourceKey as keyof typeof learnSectionData;
        const typedResourceValue = learnSectionData[typedResourceKey];
        return (
          <>
            <img
              src={typedResourceValue.imagePath}
              alt={locales.sections.learn[typedResourceKey].imgAlt}
            />
            <h3>{locales.sections.learn[typedResourceKey].headline}</h3>
            <p>{locales.sections.learn[typedResourceKey].content}</p>
            <Link
              to={typedResourceValue.link}
              rel={
                typedResourceValue.external === true
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {locales.sections.learn[typedResourceKey].action}
            </Link>
          </>
        );
      })}
      <h2>{locales.sections.contribute.headline}</h2>
      {Object.keys(contributeSectionData).map((resourceKey) => {
        const typedResourceKey =
          resourceKey as keyof typeof contributeSectionData;
        const typedResourceValue = contributeSectionData[typedResourceKey];
        return (
          <>
            <img
              src={typedResourceValue.imagePath}
              alt={locales.sections.contribute[typedResourceKey].imgAlt}
            />
            <h3>{locales.sections.contribute[typedResourceKey].headline}</h3>
            <p>{locales.sections.contribute[typedResourceKey].content}</p>
            <Link
              to={typedResourceValue.link}
              rel={
                typedResourceValue.external === true
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {locales.sections.contribute[typedResourceKey].action}
            </Link>
          </>
        );
      })}
    </>
  );
}
