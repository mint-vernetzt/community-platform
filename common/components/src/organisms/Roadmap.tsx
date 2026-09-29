import { Children } from "react";
import { Button } from "./../molecules/Button";

type RoadmapColumnProps = {
  locales: {
    roadmap: {
      controls: {
        showMore: string;
        showLess: string;
      };
    };
  };
  title: string;
  id: string;
  children?: React.ReactNode;
};

function RoadmapColumn(props: RoadmapColumnProps) {
  const { locales } = props;
  const countRoadmapCards = Children.count(props.children);
  return (
    <div>
      <h3 className="text-center mb-4 text-2xl text-primary-600 font-bold leading-6.5">
        {props.title}
      </h3>
      <div className="bg-blue-50 rounded-2xl px-4 pt-4 pb-6 md:px-6 md:pt-6 flex flex-col group">
        <input
          type="checkbox"
          id={`collapse-col-${props.id}`}
          className="peer order-2 h-0 w-0 opacity-0"
          disabled={countRoadmapCards <= 3}
        />
        <div
          className={`bg-blue-50 rounded-2xl grid overflow-hidden transition-all grid-rows-[repeat(2,1fr)_repeat(99,0fr)] @md:grid-rows-[repeat(3,1fr)_repeat(99,0fr)] peer-checked:auto-rows-fr peer-checked:grid-rows-none order-1`}
        >
          {props.children}
        </div>
        {countRoadmapCards > 3 ? (
          <label
            htmlFor={`collapse-col-${props.id}`}
            className="order-3 mt-6 relative block text-nowrap text-sm font-semibold h-5 text-primary-500 cursor-pointer leading-5"
          >
            <span className="group-has-checked:hidden block absolute inset-0 text-center hover:underline decoration-inherit decoration-auto group-has-focus:underline underline-offset-4">
              {locales.roadmap.controls.showMore}
            </span>
            <span className="group-has-checked:block hidden absolute inset-0 text-center hover:underline decoration-inherit decoration-auto group-has-focus:underline underline-offset-4">
              {locales.roadmap.controls.showLess}
            </span>
          </label>
        ) : countRoadmapCards > 2 ? (
          <>
            <label
              htmlFor={`collapse-col-${props.id}`}
              className="order-3 mt-6 relative block w-full text-sm font-semibold h-5 text-primary-500 cursor-pointer leading-5 @md:hidden underline decoration-inherit decoration-auto"
            >
              <span className="group-has-checked:hidden inset-0 text-center absolute group-hover:underline decoration-inherit decoration-auto group-has-focus:underline underline-offset-4">
                {locales.roadmap.controls.showMore}
              </span>
              <span className="group-has-checked:block hidden absolute inset-0 text-center group-hover:underline decoration-inherit decoration-auto group-has-focus:underline underline-offset-4">
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
              <span className="group-has-checked:hidden block absolute inset-0 text-center hover:underline decoration-inherit decoration-auto">
                {locales.roadmap.controls.showMore}
              </span>
              <span className="group-has-checked:block hidden absolute inset-0 text-center hover:underline decoration-inherit decoration-auto">
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

type RoadmapLocales = {
  roadmap: {
    headline: string;
    subline: string;
    controls: {
      showMore: string;
      showLess: string;
      submitIdeas: {
        subject: string;
        cta: string;
      };
    };
    ideas: {
      title: string;
      networkingFeature: {
        title: string;
        description: string;
      };
      matching: {
        title: string;
        description: string;
      };
      interaction: {
        title: string;
        description: string;
      };
      mintCampusIntegration: {
        title: string;
        description: string;
      };
    };
    inDevelopment: {
      title: string;
      oeb: {
        title: string;
        description: string;
      };
      createOwnEvents: {
        title: string;
        description: string;
      };
    };
    done: {
      title: string;
      map: {
        title: string;
        description: string;
      };
      accessibility: {
        title: string;
        description: string;
      };
      sharepic: {
        title: string;
        description: string;
      };
      mediaDatabase: {
        title: string;
        description: string;
      };
      visualizeNetworks: {
        title: string;
        description: string;
      };
      fundingSearch: {
        title: string;
        description: string;
      };
      addYourselfToOrganizations: {
        title: string;
        description: string;
      };
      faq: {
        title: string;
        description: string;
      };
      dashboard: {
        title: string;
        description: string;
      };
      filter: {
        title: string;
        description: string;
      };
      projects: {
        title: string;
        description: string;
      };
      internationalization: {
        title: string;
        description: string;
      };
      eventManagement: {
        title: string;
        description: string;
      };
      profilesAndOrganizations: {
        title: string;
        description: string;
      };
      search: {
        title: string;
        description: string;
      };
      mintId: {
        title: string;
        description: string;
      };
    };
  };
};

function Roadmap(props: { locales: RoadmapLocales }) {
  const { locales } = props;
  return (
    <div id="roadmap">
      <h2 className="text-center mb-4 text-5xl text-primary-600 font-bold leading-9">
        {locales.roadmap.headline}
      </h2>
      <p className="text-center mb-10 text-lg font-semibold leading-6 text-neutral-800">
        {locales.roadmap.subline}
      </p>
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-y-10 md:gap-y-0 md:gap-x-8">
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
      <div className="flex flex-col items-center mt-12">
        <Button
          as="link"
          variant="outline"
          to={`mailto:community@mint-vernetzt.de?subject=${locales.roadmap.controls.submitIdeas.subject}`}
        >
          {locales.roadmap.controls.submitIdeas.cta}
        </Button>
      </div>
    </div>
  );
}

export { Roadmap };
