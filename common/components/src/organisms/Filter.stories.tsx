import Filter from "./Filter";

export function FilterPlayground() {
  return (
    <div className="mv-mt-8">
      <Filter />
    </div>
  );
}
FilterPlayground.storyName = "Playground";
FilterPlayground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Organism/Filter",
  component: Filter,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
