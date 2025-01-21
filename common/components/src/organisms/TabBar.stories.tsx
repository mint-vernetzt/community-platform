import { TabBar } from "./TabBar";

export function Playground() {
  return (
    <div className="mv-mx-4">
      <TabBar>
        <TabBar.Item active>about</TabBar.Item>
        <TabBar.Item>requirements</TabBar.Item>
        <TabBar.Item>accessibility</TabBar.Item>
        <TabBar.Item>attachments</TabBar.Item>
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
