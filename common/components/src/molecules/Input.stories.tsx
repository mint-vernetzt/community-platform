import Button from "./Button";
import Input from "./Input";

type InputStoryProps = {
  withError?: boolean;
};
export function InputDefault(props: InputStoryProps) {
  return (
    <Input id="input">
      Label
      {props.withError && <Input.Error>Error</Input.Error>}
    </Input>
  );
}

InputDefault.storyName = "default";
InputDefault.args = {
  withError: false,
};
InputDefault.parameters = {
  controls: {
    disable: false,
  },
};

export function InputWithLabel(props: InputStoryProps) {
  return (
    <Input id="input">
      <Input.Label>Label</Input.Label>
      {props.withError && <Input.Error>Error</Input.Error>}
    </Input>
  );
}

InputWithLabel.storyName = "with label";
InputWithLabel.args = {
  withError: false,
};
InputWithLabel.parameters = {
  controls: {
    disable: false,
  },
};

export function InputWithSearchIcon(props: InputStoryProps) {
  return (
    <Input id="input">
      <Input.Label>Search</Input.Label>
      <Input.SearchIcon />
      {props.withError && <Input.Error>Error</Input.Error>}
    </Input>
  );
}

InputWithSearchIcon.storyName = "with search icon";
InputWithSearchIcon.args = {
  withError: false,
};
InputWithSearchIcon.parameters = {
  controls: {
    disable: false,
  },
};

export function InputWithHelperText(props: InputStoryProps) {
  return (
    <Input id="input">
      <Input.Label>Label</Input.Label>
      <Input.HelperText>Helper text</Input.HelperText>
      {props.withError && <Input.Error>Error</Input.Error>}
    </Input>
  );
}

InputWithHelperText.storyName = "with helper text";
InputWithHelperText.args = {
  withError: false,
};
InputWithHelperText.parameters = {
  controls: {
    disable: false,
  },
};

export function InputWithControls(props: InputStoryProps) {
  return (
    <Input id="input">
      <Input.Label>Label</Input.Label>
      <Input.HelperText>Helper text</Input.HelperText>
      <Input.Controls>
        <Button>Button</Button>
      </Input.Controls>
      {props.withError && <Input.Error>Error</Input.Error>}
    </Input>
  );
}

InputWithControls.storyName = "with control";
InputWithControls.args = {
  withError: false,
};
InputWithControls.parameters = {
  controls: {
    disable: false,
  },
};

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
