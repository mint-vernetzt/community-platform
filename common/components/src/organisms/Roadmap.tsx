import { Button } from "./../molecules/Button";
import React from "react";
import { type LandingPageLocales } from "~/routes/index.server";

export type RoadmapColumnProps = {
  locales: LandingPageLocales;
  title: string;
  id: string;
  children?: React.ReactNode;
};

function RoadmapColumn(props: RoadmapColumnProps) {
  const { locales } = props;
  const countRoadmapCards = React.Children.count(props.children);
  return (
    <div>
      <h4 className="mv-text-center mv-mb-4 mv-text-2xl mv-text-primary-600 mv-font-bold mv-leading-[26px]">
        {props.title}
      </h4>
      <div className="mv-bg-blue-50 mv-rounded-lg mv-p-4 @xl:mv-p-6 mv-flex mv-flex-col mv-group">
        <input
          type="checkbox"
          id={`collapse-col-${props.id}`}
          className="mv-peer mv-order-2 mv-h-0 mv-w-0 mv-opacity-0"
        />
        <div
          className={`mv-bg-blue-50 mv-rounded-lg mv-grid mv-overflow-hidden mv-transition-all mv-grid-rows-[repeat(2,_1fr)_repeat(99,_0fr)] @md:mv-grid-rows-[repeat(3,_1fr)_repeat(99,_0fr)] peer-checked:mv-grid-rows-${countRoadmapCards} mv-order-1`}
        >
          {props.children}
        </div>
        {countRoadmapCards > 3 ? (
          <label
            htmlFor={`collapse-col-${props.id}`}
            className="mv-order-3 mv-mt-4 @lg:mv-mt-6 mv-relative mv-block mv-w-full mv-text-sm mv-font-semibold mv-h-5 mv-text-primary mv-cursor-pointer group"
          >
            <span className="show-more mv-absolute mv-inset-0 mv-text-center hover:mv-underline mv-decoration-inherit mv-decoration-auto">
              {locales.roadmap.controls.showMore}
            </span>
            <span className="show-less mv-absolute mv-inset-0 mv-text-center hover:mv-underline mv-decoration-inherit mv-decoration-auto">
              {locales.roadmap.controls.showLess}
            </span>
          </label>
        ) : countRoadmapCards > 2 ? (
          <>
            <label
              htmlFor={`collapse-col-${props.id}`}
              className="mv-order-3 mv-mt-4 @lg:mv-mt-6 mv-relative mv-block mv-w-full mv-text-sm mv-font-semibold mv-h-5 mv-text-primary mv-cursor-pointer group @md:mv-hidden mv-underline mv-decoration-inherit mv-decoration-auto"
            >
              <span className="show-more mv-absolute mv-inset-0 mv-text-center group-hover:mv-underline mv-decoration-inherit mv-decoration-auto">
                {locales.roadmap.controls.showMore}
              </span>
              <span className="show-less mv-absolute mv-inset-0 mv-text-center group-hover:mv-underline mv-decoration-inherit mv-decoration-auto">
                {locales.roadmap.controls.showLess}
              </span>
            </label>
            <div className="mv-hidden @md:mv-block mv-mt-4 @lg:mv-mt-6 mv-h-5 mv-order-3"></div>
          </>
        ) : (
          <div className="mv-hidden @md:mv-block mv-mt-4 @lg:mv-mt-6 mv-h-5 mv-order-3"></div>
        )}
      </div>
    </div>
  );
}

export type RoadmapCardProps = {
  title: string;
  text: string;
};

function RoadmapCard(props: RoadmapCardProps) {
  return (
    <div className="mv-card mv-bg-white mv-rounded-lg mv-text-primary mv-w-full mv-px-4 @xl:mv-px-6">
      <h5 className="mv-font-bold mv-text-lg mv-mb-3">{props.title}</h5>
      <p>{props.text}</p>
    </div>
  );
}

function Roadmap(props: { locales: LandingPageLocales }) {
  const { locales } = props;
  return (
    <section
      id="roadmap"
      className="bg-[linear-gradient(358.45deg,_#FFFFFF_12.78%,_rgba(255,255,255,0.4)_74.48%,_rgba(255,255,255,0.4)_98.12%)] mv-py-16"
    >
      <h3 className="mv-text-center mv-mb-4 mv-text-5xl mv-text-primary-600 mv-font-bold mv-all-small-caps mv-subpixel-antialiased mv-leading-9">
        {locales.roadmap.headline}
      </h3>
      <p className="mv-text-center mv-mb-16 mv-text-2xl mv-font-semibold mv-leading-[26px] mv-text-primary-600">
        {locales.roadmap.subline}
      </p>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl">
        <div className="mv-grid mv-grid-cols-1 @md:mv-grid-cols-2 @xl:mv-grid-cols-3 mv-gap-y-8 @md:mv-gap-y-12 @md:mv-gap-x-4 @xl:mv-gap-x-4">
          <RoadmapColumn
            locales={locales}
            title={locales.roadmap.ideas.title}
            id="1"
          >
            <RoadmapCard
              title={locales.roadmap.ideas.networkingFeature.title}
              text={locales.roadmap.ideas.networkingFeature.description}
            />
            <RoadmapCard
              title={locales.roadmap.ideas.matching.title}
              text={locales.roadmap.ideas.matching.description}
            />
            <RoadmapCard
              title={locales.roadmap.ideas.interaction.title}
              text={locales.roadmap.ideas.interaction.description}
            />
            <RoadmapCard
              title={locales.roadmap.ideas.mintCampusIntegration.title}
              text={locales.roadmap.ideas.mintCampusIntegration.description}
            />
          </RoadmapColumn>

          <RoadmapColumn
            locales={locales}
            title={locales.roadmap.inDevelopment.title}
            id="2"
          >
            <RoadmapCard
              title={locales.roadmap.inDevelopment.createOwnEvents.title}
              text={locales.roadmap.inDevelopment.createOwnEvents.description}
            />
            <RoadmapCard
              title={
                locales.roadmap.inDevelopment.sharepicAndMediaDatabase.title
              }
              text={
                locales.roadmap.inDevelopment.sharepicAndMediaDatabase
                  .description
              }
            />
          </RoadmapColumn>

          <RoadmapColumn
            locales={locales}
            title={locales.roadmap.done.title}
            id="3"
          >
            <RoadmapCard
              title={locales.roadmap.done.visualizeNetworks.title}
              text={locales.roadmap.done.visualizeNetworks.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.fundingSearch.title}
              text={locales.roadmap.done.fundingSearch.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.addYourselfToOrganizations.title}
              text={locales.roadmap.done.addYourselfToOrganizations.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.faq.title}
              text={locales.roadmap.done.faq.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.dashboard.title}
              text={locales.roadmap.done.dashboard.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.filter.title}
              text={locales.roadmap.done.filter.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.projects.title}
              text={locales.roadmap.done.projects.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.internationalization.title}
              text={locales.roadmap.done.internationalization.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.eventManagement.title}
              text={locales.roadmap.done.eventManagement.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.profilesAndOrganizations.title}
              text={locales.roadmap.done.profilesAndOrganizations.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.search.title}
              text={locales.roadmap.done.search.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.mintId.title}
              text={locales.roadmap.done.mintId.description}
            />
          </RoadmapColumn>
        </div>
        <div className="mv-flex mv-flex-col mv-items-center mv-mt-12 mv-gap-4">
          <Button
            as="a"
            variant="outline"
            href="mailto:community@mint-vernetzt.de"
          >
            {locales.roadmap.controls.submitIdeas}
          </Button>
          <div className="mv-flex mv-flex-col mv-gap-1">
            <p className="mv-text-center mv-leading-[22px] mv-text-primary-600">
              {locales.roadmap.controls.ctaQuestion}
            </p>
            <p className="mv-text-center mv-leading-[22px] mv-text-primary-600">
              {locales.roadmap.controls.cta}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export { Roadmap };
