import { detectLanguage } from "./../i18n.server";
import type { Route } from "./+types/resources";
import { languageModuleMap } from "./../locales/.server";
import ResourceList from "~/components-next/ResourceList";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { External } from "~/components-next/icons/External";
import React from "react";
import BetaTag from "~/components-next/BetaTag";

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
      imageClassName: string;
      external: boolean;
      beta?: boolean;
      bgClassName?: string;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    mediaDatabase: {
      link: "https://mediendatenbank.mint-vernetzt.de",
      imagePath: "/images/media-database.png",
      imageClassName: "mv-w-full mv-h-full mv-object-contain",
      external: true,
      beta: true,
      bgClassName: "mv-bg-neutral-50",
    },
    sharepic: {
      link: "https://mint.sharepicgenerator.de",
      imagePath: "/images/sharepic-generator.png",
      imageClassName: "mv-w-[114px] mv-h-[114px]",
      external: true,
      beta: true,
      bgClassName: "mv-bg-neutral-100",
    },
    fundingSearch: {
      link: "/explore/fundings",
      imagePath: "/images/funding-search.png",
      imageClassName: "mv-w-[80px] mv-h-[78px]",
      external: false,
      beta: true,
      bgClassName: "mv-bg-neutral-50",
    },
    oeb: {
      link: "https://openbadges.education",
      imagePath: "/images/oeb.png",
      imageClassName: "mv-w-[104px] mv-h-[116px]",
      external: true,
      bgClassName: "mv-bg-neutral-50",
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
      imageClassName: string;
      external: boolean;
      beta?: boolean;
      bgClassName?: string;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    mintVernetzt: {
      link: "https://www.mint-vernetzt.de",
      imagePath: "/images/mint-vernetzt.png",
      imageClassName: "mv-w-full mv-h-full mv-object-contain",
      external: true,
      bgClassName: "mv-bg-[#164194]",
    },
    meshMint: {
      link: "https://www.meshmint.org",
      imagePath: "/images/mesh-mint.png",
      imageClassName: "mv-w-full mv-h-full mv-object-contain",
      external: true,
      bgClassName: "mv-bg-[#0C9C85]",
    },
    mintDataLab: {
      link: "https://datalab.mint-vernetzt.de",
      imagePath: "/images/mint-datalab.png",
      imageClassName: "mv-w-[127px] mv-h-[114px]",
      external: true,
      bgClassName: "mv-bg-[#D1A9CC]",
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
      imageClassName: string;
      external: boolean;
      beta?: boolean;
      bgClassName?: string;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    mintCampus: {
      link: "https://mintcampus.org",
      imagePath: "/images/mint-campus.png",
      imageClassName: "mv-w-full mv-h-full mv-object-contain",
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
      imageClassName: string;
      external: boolean;
      beta?: boolean;
      bgClassName?: string;
    };
  };
  const resourceListItems: Omit<ResourceListItem, "headline"> = {
    github: {
      link: "https://github.com/mint-vernetzt/community-platform",
      imagePath: "/images/github.png",
      imageClassName: "mv-w-[104px] mv-h-[102px]",
      external: true,
      bgClassName: "mv-bg-neutral-900",
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

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    setIsMobile(window.innerWidth < 600);
  }, []);

  return (
    <div className="mv-flex mv-flex-col mv-items-center mv-gap-8 mv-mt-10 mv-mb-24">
      <div className="mv-flex mv-flex-col mv-items-center mv-gap-2 mv-px-6">
        <h1 className="mv-text-center mv-text-primary mv-text-5xl mv-font-black mv-leading-9 mv-mb-0">
          {locales.headline}
        </h1>
        <p className="mv-text-center mv-text-neutral-600 mv-text-base mv-font-semibold mv-leading-5">
          {locales.subline}
        </p>
      </div>
      <div className="mv-flex mv-flex-col mv-items-center mv-gap-16 mv-px-4">
        <ResourceList>
          <ResourceList.Header>
            <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-2xl mv-font-semibold mv-leading-6">
              {locales.sections.tools.headline}
            </h2>
          </ResourceList.Header>
          {Object.keys(toolsSectionData).map((resourceKey) => {
            const typedResourceKey =
              resourceKey as keyof typeof toolsSectionData;
            const typedResourceValue = toolsSectionData[typedResourceKey];
            return (
              <ResourceList.ListItem key={typedResourceKey}>
                <ResourceList.ListItem.ImageSection
                  className={typedResourceValue.bgClassName}
                >
                  <img
                    src={typedResourceValue.imagePath}
                    alt={locales.sections.tools[typedResourceKey].imgAlt}
                    className={typedResourceValue.imageClassName}
                  />
                </ResourceList.ListItem.ImageSection>
                <ResourceList.ListItem.ContentSection>
                  <ResourceList.ListItem.ContentSection.Header>
                    <h3 className="mv-mb-0 mv-text-primary mv-text-xl mv-font-bold mv-leading-6">
                      {locales.sections.tools[typedResourceKey].headline}
                    </h3>
                    {typedResourceValue.beta ? <BetaTag /> : null}
                  </ResourceList.ListItem.ContentSection.Header>
                  <p className="mv-text-neutral-600 mv-text-base mv-font-normal mv-leading-5">
                    {locales.sections.tools[typedResourceKey].content}
                  </p>
                </ResourceList.ListItem.ContentSection>
                <ResourceList.ListItem.ActionSection>
                  <Button
                    as="a"
                    variant="outline"
                    href={typedResourceValue.link}
                    rel={
                      typedResourceValue.external === true
                        ? "noopener noreferrer"
                        : undefined
                    }
                    target={
                      typedResourceValue.external === true
                        ? "_blank"
                        : undefined
                    }
                    fullSize
                    disabled={
                      typedResourceKey === "sharepic" && isMobile === true
                    }
                  >
                    <span>
                      <External />
                    </span>
                    <span>
                      {locales.sections.tools[typedResourceKey].action}
                    </span>
                  </Button>
                  {typedResourceKey === "sharepic" ? (
                    <p className="mv-text-neutral-700 mv-text-sm mv-font-normal mv-leading-normal">
                      {locales.sections.tools[typedResourceKey].desktopOnly}
                    </p>
                  ) : null}
                </ResourceList.ListItem.ActionSection>
              </ResourceList.ListItem>
            );
          })}
        </ResourceList>
        <ResourceList>
          <ResourceList.Header>
            <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-2xl mv-font-semibold mv-leading-6">
              {locales.sections.information.headline}
            </h2>
          </ResourceList.Header>
          {Object.keys(informationSectionData).map((resourceKey) => {
            const typedResourceKey =
              resourceKey as keyof typeof informationSectionData;
            const typedResourceValue = informationSectionData[typedResourceKey];
            return (
              <ResourceList.ListItem key={typedResourceKey}>
                <ResourceList.ListItem.ImageSection
                  className={typedResourceValue.bgClassName}
                >
                  <img
                    src={typedResourceValue.imagePath}
                    alt={locales.sections.information[typedResourceKey].imgAlt}
                    className={typedResourceValue.imageClassName}
                  />
                </ResourceList.ListItem.ImageSection>
                <ResourceList.ListItem.ContentSection>
                  <ResourceList.ListItem.ContentSection.Header>
                    <h3 className="mv-mb-0 mv-text-primary mv-text-xl mv-font-bold mv-leading-6">
                      {locales.sections.information[typedResourceKey].headline}
                    </h3>
                    {typedResourceValue.beta ? <BetaTag /> : null}
                  </ResourceList.ListItem.ContentSection.Header>
                  <p className="mv-text-neutral-600 mv-text-base mv-font-normal mv-leading-5">
                    {locales.sections.information[typedResourceKey].content}
                  </p>
                </ResourceList.ListItem.ContentSection>
                <ResourceList.ListItem.ActionSection>
                  <Button
                    as="a"
                    variant="outline"
                    href={typedResourceValue.link}
                    rel={
                      typedResourceValue.external === true
                        ? "noopener noreferrer"
                        : undefined
                    }
                    target={
                      typedResourceValue.external === true
                        ? "_blank"
                        : undefined
                    }
                    fullSize
                  >
                    <span>
                      <External />
                    </span>
                    <span>
                      {locales.sections.information[typedResourceKey].action}
                    </span>
                  </Button>
                </ResourceList.ListItem.ActionSection>
              </ResourceList.ListItem>
            );
          })}
        </ResourceList>
        <ResourceList>
          <ResourceList.Header>
            <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-2xl mv-font-semibold mv-leading-6">
              {locales.sections.learn.headline}
            </h2>
          </ResourceList.Header>
          {Object.keys(learnSectionData).map((resourceKey) => {
            const typedResourceKey =
              resourceKey as keyof typeof learnSectionData;
            const typedResourceValue = learnSectionData[typedResourceKey];
            return (
              <ResourceList.ListItem key={typedResourceKey}>
                <ResourceList.ListItem.ImageSection
                  className={typedResourceValue.bgClassName}
                >
                  <img
                    src={typedResourceValue.imagePath}
                    alt={locales.sections.learn[typedResourceKey].imgAlt}
                    className={typedResourceValue.imageClassName}
                  />
                </ResourceList.ListItem.ImageSection>
                <ResourceList.ListItem.ContentSection>
                  <ResourceList.ListItem.ContentSection.Header>
                    <h3 className="mv-mb-0 mv-text-primary mv-text-xl mv-font-bold mv-leading-6">
                      {locales.sections.learn[typedResourceKey].headline}
                    </h3>
                    {typedResourceValue.beta ? <BetaTag /> : null}
                  </ResourceList.ListItem.ContentSection.Header>
                  <p className="mv-text-neutral-600 mv-text-base mv-font-normal mv-leading-5">
                    {locales.sections.learn[typedResourceKey].content}
                  </p>
                </ResourceList.ListItem.ContentSection>
                <ResourceList.ListItem.ActionSection>
                  <Button
                    as="a"
                    variant="outline"
                    href={typedResourceValue.link}
                    rel={
                      typedResourceValue.external === true
                        ? "noopener noreferrer"
                        : undefined
                    }
                    target={
                      typedResourceValue.external === true
                        ? "_blank"
                        : undefined
                    }
                    fullSize
                  >
                    <span>
                      <External />
                    </span>
                    <span>
                      {locales.sections.learn[typedResourceKey].action}
                    </span>
                  </Button>
                </ResourceList.ListItem.ActionSection>
              </ResourceList.ListItem>
            );
          })}
        </ResourceList>
        <ResourceList>
          <ResourceList.Header>
            <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-2xl mv-font-semibold mv-leading-6">
              {locales.sections.contribute.headline}
            </h2>
          </ResourceList.Header>
          {Object.keys(contributeSectionData).map((resourceKey) => {
            const typedResourceKey =
              resourceKey as keyof typeof contributeSectionData;
            const typedResourceValue = contributeSectionData[typedResourceKey];
            return (
              <ResourceList.ListItem key={typedResourceKey}>
                <ResourceList.ListItem.ImageSection
                  className={typedResourceValue.bgClassName}
                >
                  <img
                    src={typedResourceValue.imagePath}
                    alt={locales.sections.contribute[typedResourceKey].imgAlt}
                    className={typedResourceValue.imageClassName}
                  />
                </ResourceList.ListItem.ImageSection>
                <ResourceList.ListItem.ContentSection>
                  <ResourceList.ListItem.ContentSection.Header>
                    <h3 className="mv-mb-0 mv-text-primary mv-text-xl mv-font-bold mv-leading-6">
                      {locales.sections.contribute[typedResourceKey].headline}
                    </h3>
                    {typedResourceValue.beta ? <BetaTag /> : null}
                  </ResourceList.ListItem.ContentSection.Header>
                  <p className="mv-text-neutral-600 mv-text-base mv-font-normal mv-leading-5">
                    {locales.sections.contribute[typedResourceKey].content}
                  </p>
                </ResourceList.ListItem.ContentSection>
                <ResourceList.ListItem.ActionSection>
                  <Button
                    as="a"
                    variant="outline"
                    href={typedResourceValue.link}
                    rel={
                      typedResourceValue.external === true
                        ? "noopener noreferrer"
                        : undefined
                    }
                    target={
                      typedResourceValue.external === true
                        ? "_blank"
                        : undefined
                    }
                    fullSize
                  >
                    <span>
                      <External />
                    </span>
                    <span>
                      {locales.sections.contribute[typedResourceKey].action}
                    </span>
                  </Button>
                </ResourceList.ListItem.ActionSection>
              </ResourceList.ListItem>
            );
          })}
        </ResourceList>
      </div>
    </div>
  );
}
