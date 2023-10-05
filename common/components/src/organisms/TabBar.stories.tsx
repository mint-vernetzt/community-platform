import TabBar from "./TabBar";

export function Playground() {
  return <TabBar />;
}

Playground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Organism/TabBar",
  component: TabBar,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
