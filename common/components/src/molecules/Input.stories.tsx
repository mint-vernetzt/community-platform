import Input from "./Input";

export function InputDefault() {
  return <Input id="input">Label</Input>;
}

InputDefault.storyName = "default";

export function InputWithLabel() {
  return (
    <Input id="input">
      <Input.Label hidden>Label</Input.Label>
    </Input>
  );
}

InputWithLabel.storyName = "with label";

export function InputWithSearchIcon() {
  return (
    <Input id="input">
      <Input.Label>Search</Input.Label>
      <Input.SearchIcon />
    </Input>
  );
}

InputWithSearchIcon.storyName = "with search icon";

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
