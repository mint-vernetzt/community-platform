import { languageModuleMap } from "~/locales/.server";
import { Roadmap } from "./Roadmap";

export function RoadmapPlayground() {
  const locales = languageModuleMap["de"]["index"];
  return (
    <div className="mv-mt-8">
      <Roadmap locales={locales} />
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
