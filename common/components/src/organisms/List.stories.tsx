import List from "./List";

export function LinkItemPlayground() {
  return (
    <div className="mv-p-6">
      <List.Item />
    </div>
  );
}
LinkItemPlayground.storyName = "item";
LinkItemPlayground.args = {};
LinkItemPlayground.argTypes = {};
LinkItemPlayground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Organism/List",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
