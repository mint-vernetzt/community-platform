import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import BetaTag from "~/components-next/BetaTag";
import { External } from "~/components-next/icons/External";
import ResourceList from "~/components-next/ResourceList";
import { RichText } from "~/components/Richtext/RichText";
import type { Route } from "./+types/resources";
import { detectLanguage } from "./../i18n.server";
import { languageModuleMap } from "./../locales/.server";

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
      beta: true,
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

function getDataForInformationSection() {
  type ResourceKey =
    keyof Route.ComponentProps["loaderData"]["locales"]["sections"]["information"];
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

function getDataForLearnSection() {
  type ResourceKey =
    keyof Route.ComponentProps["loaderData"]["locales"]["sections"]["learn"];
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

function getDataForContributeSection() {
  type ResourceKey =
    keyof Route.ComponentProps["loaderData"]["locales"]["sections"]["contribute"];
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

export default function Resources({ loaderData }: Route.ComponentProps) {
  const { locales } = loaderData;
  const toolsSectionData = getDataForToolsSection();
  const informationSectionData = getDataForInformationSection();
  const learnSectionData = getDataForLearnSection();
  const contributeSectionData = getDataForContributeSection();

  return (
    <div className="flex flex-col items-center gap-8 mt-10 @lg:mt-8 mb-24">
      <div className="w-full max-w-screen-2xl flex flex-col items-center gap-2 px-6 @lg:px-8">
        <h1 className="text-center text-primary text-5xl @lg:text-7xl font-black leading-9 @lg:leading-[52px] mb-0">
          {locales.headline}
        </h1>
        <p className="text-center text-neutral-600 text-base @lg:text-lg font-semibold leading-5 @lg:leading-6">
          {locales.subline}
        </p>
      </div>
      <div className="w-full max-w-screen-2xl flex flex-col items-center gap-16 @lg:gap-12 px-4 @lg:px-8">
        <ResourceList>
          <ResourceList.Header>
            <h2 className="mb-0 text-neutral-700 text-2xl font-semibold leading-6 @lg:leading-[26px]">
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
                  fullWidth={typedResourceKey === "mediaDatabase"}
                >
                  <Image
                    src={typedResourceValue.imagePath}
                    blurredSrc={typedResourceValue.blurredImagePath}
                    alt={locales.sections.tools[typedResourceKey].imgAlt}
                  />
                </ResourceList.ListItem.ImageSection>
                <ResourceList.ListItem.ContentSection>
                  <ResourceList.ListItem.ContentSection.Header>
                    <h3 className="mb-0 text-primary text-xl font-bold leading-6">
                      {locales.sections.tools[typedResourceKey].headline}
                    </h3>
                    {typedResourceValue.beta ? <BetaTag /> : null}
                  </ResourceList.ListItem.ContentSection.Header>
                  <div className="text-neutral-600 text-base font-normal leading-5">
                    <RichText
                      html={locales.sections.tools[typedResourceKey].content}
                    />
                  </div>
                </ResourceList.ListItem.ContentSection>
                <ResourceList.ListItem.ActionSection>
                  <Button
                    as="link"
                    variant="outline"
                    to={typedResourceValue.link}
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
                    className="w-full @lg:w-fit"
                    prefetch={
                      typedResourceValue.external === true ? "none" : "intent"
                    }
                  >
                    {typedResourceValue.external ? (
                      <span>
                        <External />
                      </span>
                    ) : null}
                    <span>
                      {locales.sections.tools[typedResourceKey].action}
                    </span>
                  </Button>
                </ResourceList.ListItem.ActionSection>
              </ResourceList.ListItem>
            );
          })}
        </ResourceList>
        <ResourceList>
          <ResourceList.Header>
            <h2 className="mb-0 text-neutral-700 text-2xl font-semibold leading-6 @lg:leading-[26px]">
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
                  <Image
                    src={typedResourceValue.imagePath}
                    blurredSrc={typedResourceValue.blurredImagePath}
                    alt={locales.sections.information[typedResourceKey].imgAlt}
                  />
                </ResourceList.ListItem.ImageSection>
                <ResourceList.ListItem.ContentSection>
                  <ResourceList.ListItem.ContentSection.Header>
                    <h3 className="mb-0 text-primary text-xl font-bold leading-6">
                      {locales.sections.information[typedResourceKey].headline}
                    </h3>
                    {typedResourceValue.beta ? <BetaTag /> : null}
                  </ResourceList.ListItem.ContentSection.Header>
                  <div className="text-neutral-600 text-base font-normal leading-5">
                    <RichText
                      html={
                        locales.sections.information[typedResourceKey].content
                      }
                    />
                  </div>
                </ResourceList.ListItem.ContentSection>
                <ResourceList.ListItem.ActionSection>
                  <Button
                    as="link"
                    variant="outline"
                    to={typedResourceValue.link}
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
                    className="w-full @lg:w-fit"
                    prefetch={
                      typedResourceValue.external === true ? "none" : "intent"
                    }
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
            <h2 className="mb-0 text-neutral-700 text-2xl font-semibold leading-6 @lg:leading-[26px]">
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
                  fullWidth={typedResourceKey === "mintCampus"}
                >
                  <img
                    srcSet={
                      typedResourceKey === "mintCampus"
                        ? "/images/mint-campus.png 715w, /images/mint-campus-mobile.png 288w"
                        : undefined
                    }
                    sizes={
                      typedResourceKey === "mintCampus"
                        ? "(max-width: 965px) 715px, 288px"
                        : undefined
                    }
                    src={typedResourceValue.imagePath}
                    alt={locales.sections.learn[typedResourceKey].imgAlt}
                    className="w-full h-full object-cover"
                  />
                </ResourceList.ListItem.ImageSection>
                <ResourceList.ListItem.ContentSection>
                  <ResourceList.ListItem.ContentSection.Header>
                    <h3 className="mb-0 text-primary text-xl font-bold leading-6">
                      {locales.sections.learn[typedResourceKey].headline}
                    </h3>
                    {typedResourceValue.beta ? <BetaTag /> : null}
                  </ResourceList.ListItem.ContentSection.Header>
                  <p className="text-neutral-600 text-base font-normal leading-5">
                    {locales.sections.learn[typedResourceKey].content}
                  </p>
                </ResourceList.ListItem.ContentSection>
                <ResourceList.ListItem.ActionSection>
                  <Button
                    as="link"
                    variant="outline"
                    to={typedResourceValue.link}
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
                    className="w-full @lg:w-fit"
                    prefetch={
                      typedResourceValue.external === true ? "none" : "intent"
                    }
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
            <h2 className="mb-0 text-neutral-700 text-2xl font-semibold leading-6 @lg:leading-[26px]">
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
                  <Image
                    src={typedResourceValue.imagePath}
                    blurredSrc={typedResourceValue.blurredImagePath}
                    alt={locales.sections.contribute[typedResourceKey].imgAlt}
                  />
                </ResourceList.ListItem.ImageSection>
                <ResourceList.ListItem.ContentSection>
                  <ResourceList.ListItem.ContentSection.Header>
                    <h3 className="mb-0 text-primary text-xl font-bold leading-6">
                      {locales.sections.contribute[typedResourceKey].headline}
                    </h3>
                    {typedResourceValue.beta ? <BetaTag /> : null}
                  </ResourceList.ListItem.ContentSection.Header>
                  <p className="text-neutral-600 text-base font-normal leading-5">
                    {locales.sections.contribute[typedResourceKey].content}
                  </p>
                </ResourceList.ListItem.ContentSection>
                <ResourceList.ListItem.ActionSection>
                  <Button
                    as="link"
                    variant="outline"
                    to={typedResourceValue.link}
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
                    className="w-full @lg:w-fit"
                    prefetch={
                      typedResourceValue.external === true ? "none" : "intent"
                    }
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
