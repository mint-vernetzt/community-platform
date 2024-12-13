import { Roadmap } from "./Roadmap";

export function RoadmapPlayground() {
  return (
    <div className="mv-mt-8">
      <Roadmap />
    </div>
  );
}
RoadmapPlayground.storyName = "Playground";
RoadmapPlayground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Organism/Roadmap",
  component: Roadmap,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
