import { Children } from "react";
import { Button } from "./../molecules/Button";
import { type LandingPageLocales } from "~/routes/index.server";

type RoadmapColumnProps = {
  locales: LandingPageLocales;
  title: string;
  id: string;
  children?: React.ReactNode;
};

function RoadmapColumn(props: RoadmapColumnProps) {
  const { locales } = props;
  const countRoadmapCards = Children.count(props.children);
  return (
    <div>
      <h3 className="text-center mb-4 text-2xl text-primary-600 font-bold leading-[26px]">
        {props.title}
      </h3>
      <div className="bg-blue-50 rounded-lg p-4 @xl:p-6 flex flex-col group">
        <input
          type="checkbox"
          id={`collapse-col-${props.id}`}
          className="peer order-2 h-0 w-0 opacity-0"
          disabled={countRoadmapCards <= 3}
        />
        <div
          className={`bg-blue-50 rounded-lg grid overflow-hidden transition-all grid-rows-[repeat(2,_1fr)_repeat(99,_0fr)] @md:grid-rows-[repeat(3,_1fr)_repeat(99,_0fr)] peer-checked:auto-rows-fr peer-checked:grid-rows-none order-1`}
        >
          {props.children}
        </div>
        {countRoadmapCards > 3 ? (
          <label
            htmlFor={`collapse-col-${props.id}`}
            className="order-3 mt-4 @lg:mt-6 relative block text-nowrap text-sm font-semibold h-5 text-primary-700 cursor-pointer"
          >
            <span className="group-has-[:checked]:hidden block absolute inset-0 text-center hover:underline decoration-inherit decoration-auto group-has-[:focus]:underline underline-offset-4">
              {locales.roadmap.controls.showMore}
            </span>
            <span className="group-has-[:checked]:block hidden absolute inset-0 text-center hover:underline decoration-inherit decoration-auto group-has-[:focus]:underline underline-offset-4">
              {locales.roadmap.controls.showLess}
            </span>
          </label>
        ) : countRoadmapCards > 2 ? (
          <>
            <label
              htmlFor={`collapse-col-${props.id}`}
              className="order-3 mt-4 @lg:mt-6 relative block w-full text-sm font-semibold h-5 text-primary-700 cursor-pointer @md:hidden underline decoration-inherit decoration-auto"
            >
              <span className="group-has-[:checked]:hidden inset-0 text-center absolute group-hover:underline decoration-inherit decoration-auto group-has-[:focus]:underline underline-offset-4">
                {locales.roadmap.controls.showMore}
              </span>
              <span className="group-has-[:checked]:block hidden absolute inset-0 text-center group-hover:underline decoration-inherit decoration-auto group-has-[:focus]:underline underline-offset-4">
                {locales.roadmap.controls.showLess}
              </span>
            </label>
            <div className="hidden @md:block mt-4 @lg:mt-6 h-5 order-3"></div>
          </>
        ) : (
          <>
            <label
              htmlFor={`collapse-col-${props.id}`}
              className="order-3 absolute w-0 h-0 opacity-0"
              aria-disabled="true"
            >
              <span className="group-has-[:checked]:hidden block absolute inset-0 text-center hover:underline decoration-inherit decoration-auto">
                {locales.roadmap.controls.showMore}
              </span>
              <span className="group-has-[:checked]:block hidden absolute inset-0 text-center hover:underline decoration-inherit decoration-auto">
                {locales.roadmap.controls.showLess}
              </span>
            </label>
            <div className="hidden @md:block mt-4 @lg:mt-6 h-5 order-3"></div>
          </>
        )}
      </div>
    </div>
  );
}

type RoadmapCardProps = {
  title: string;
  text: string;
};

function RoadmapCard(props: RoadmapCardProps) {
  return (
    <div className="card bg-white rounded-lg text-primary w-full px-4 @xl:px-6">
      <h4 className="font-bold text-lg mb-3">{props.title}</h4>
      <p>{props.text}</p>
    </div>
  );
}

function Roadmap(props: { locales: LandingPageLocales }) {
  const { locales } = props;
  return (
    <section
      id="roadmap"
      className="bg-[linear-gradient(358.45deg,_#FFFFFF_12.78%,_rgba(255,255,255,0.4)_74.48%,_rgba(255,255,255,0.4)_98.12%)] py-16"
    >
      <h2 className="text-center mb-4 text-4xl text-primary-600 font-bold subpixel-antialiased leading-9 uppercase">
        {locales.roadmap.headline}
      </h2>
      <p className="text-center mb-16 text-2xl font-semibold leading-[26px] text-primary-600">
        {locales.roadmap.subline}
      </p>
      <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl">
        <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-y-8 @md:gap-y-12 @md:gap-x-4 @xl:gap-x-4">
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
              title={locales.roadmap.inDevelopment.oeb.title}
              text={locales.roadmap.inDevelopment.oeb.description}
            />
            <RoadmapCard
              title={locales.roadmap.inDevelopment.createOwnEvents.title}
              text={locales.roadmap.inDevelopment.createOwnEvents.description}
            />
          </RoadmapColumn>

          <RoadmapColumn
            locales={locales}
            title={locales.roadmap.done.title}
            id="3"
          >
            <RoadmapCard
              title={locales.roadmap.done.map.title}
              text={locales.roadmap.done.map.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.accessibility.title}
              text={locales.roadmap.done.accessibility.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.sharepic.title}
              text={locales.roadmap.done.sharepic.description}
            />
            <RoadmapCard
              title={locales.roadmap.done.mediaDatabase.title}
              text={locales.roadmap.done.mediaDatabase.description}
            />
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
        <div className="flex flex-col items-center mt-12 gap-4">
          <Button
            as="link"
            variant="outline"
            to="mailto:community@mint-vernetzt.de"
          >
            {locales.roadmap.controls.submitIdeas}
          </Button>
          <div className="flex flex-col gap-1">
            <p className="text-center leading-[22px] text-primary-600">
              {locales.roadmap.controls.ctaQuestion}
            </p>
            <p className="text-center leading-[22px] text-primary-600">
              {locales.roadmap.controls.cta}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export { Roadmap };
