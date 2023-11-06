import Input from "./Input";

export function InputPlayground() {
  return <Input id="search">Label</Input>;
}
InputPlayground.storyName = "Playground";
InputPlayground.args = {};
InputPlayground.argTypes = {};
InputPlayground.parameters = {};

export default {
  title: "Molecules/Input",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
