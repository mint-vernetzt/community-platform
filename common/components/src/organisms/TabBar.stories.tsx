import TabBar, { TabBarItem } from "./TabBar";

export function Playground() {
  return (
    <div className="mv-mx-4">
      <TabBar>
        <TabBarItem active>about</TabBarItem>
        <TabBarItem>requirements</TabBarItem>
        <TabBarItem>accessibility</TabBarItem>
        <TabBarItem>attachments</TabBarItem>
      </TabBar>
    </div>
  );
}

Playground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xs",
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
