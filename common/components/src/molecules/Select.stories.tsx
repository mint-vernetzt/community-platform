import Select from "./Select";

type SelectStoryProps = {
  withError?: boolean;
};

export function SelectPlayground(props: SelectStoryProps) {
  return (
    <Select>
      <Select.Label>Label</Select.Label>
      <option>Option 1</option>
      <option>Option 2</option>
      <option>Option 3</option>
      {props.withError && <Select.Error>Error</Select.Error>}
    </Select>
  );
}
SelectPlayground.storyName = "Playground";
SelectPlayground.args = {
  withError: false,
};
SelectPlayground.argTypes = {};
SelectPlayground.parameters = {
  controls: {
    disable: false,
  },
};

export default {
  title: "Molecules/Select",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
