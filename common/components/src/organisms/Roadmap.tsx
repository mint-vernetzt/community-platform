import { Children, isValidElement } from "react";
import { Button } from "./../molecules/Button";

type RoadmapColumnProps = {
  locales: {
    roadmap: {
      controls: {
        showMore: string;
        showLess: string;
        ariaLabel: string;
      };
    };
  };
  title: string;
  id: string;
  children?: React.ReactNode;
};

function RoadmapColumn(props: RoadmapColumnProps) {
  const { locales } = props;
  const childrenArray = Children.toArray(props.children);
  const roadmapCards = childrenArray.filter(
    (child) => isValidElement(child) && child.type === RoadmapCard
  );
  const countRoadmapCards = roadmapCards.length;
  return (
    <div className="w-full flex flex-col items-center gap-4">
      <h3 className="mb-0 text-primary-600 text-2xl font-bold leading-6.5">
        {props.title}
      </h3>
      <div className="relative group w-full flex flex-col items-center gap-6 px-4 lg:px-6 pt-4 lg:pt-6 pb-6 rounded-2xl bg-primary-50">
        <input
          type="checkbox"
          id={`collapse-col-${props.id}`}
          className="absolute w-0 h-0 opacity-0"
          disabled={countRoadmapCards <= 3}
          aria-label={locales.roadmap.controls.ariaLabel}
        />
        <div className="w-full flex flex-col items-center gap-6">
          {roadmapCards.map((card, index) => (
            <div
              key={index}
              className={`${index >= 3 ? "hidden group-has-checked:block" : ""}`}
            >
              {card}
            </div>
          ))}
        </div>
        {countRoadmapCards > 3 && (
          <label
            htmlFor={`collapse-col-${props.id}`}
            className="text-primary text-sm font-semibold leading-5 hover:underline focus:outline-none focus:underline underline-offset-4 cursor-pointer"
          >
            <span className="group-has-checked:hidden">
              {locales.roadmap.controls.showMore}
            </span>
            <span className="hidden group-has-checked:inline">
              {locales.roadmap.controls.showLess}
            </span>
          </label>
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
    <div className="w-full min-h-46.5 flex flex-col gap-2.5 bg-white rounded-lg p-4">
      <h4 className="mb-0 text-primary text-lg font-bold leading-6">
        {props.title}
      </h4>
      <p className="text-primary text-base font-semibold leading-5">
        {props.text}
      </p>
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
      ariaLabel: string;
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
    };
    done: {
      title: string;
      createOwnEvents: {
        title: string;
        description: string;
      };
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
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 lg:gap-y-0 sm:gap-x-8">
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
        </RoadmapColumn>

        <RoadmapColumn
          locales={locales}
          title={locales.roadmap.done.title}
          id="3"
        >
          <RoadmapCard
            title={locales.roadmap.done.createOwnEvents.title}
            text={locales.roadmap.done.createOwnEvents.description}
          />
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
