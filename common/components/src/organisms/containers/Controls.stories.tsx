import { Button } from "./../../../index";
import Controls, { type ControlsProps } from "./Controls";

type ControlsPlaygroundProps = {
  direction: ControlsProps["direction"];
};

export function Playground(props: ControlsPlaygroundProps) {
  return (
    <Controls direction={props.direction}>
      <Button>Yes</Button>
      <Button>No</Button>
      <Button>Maybe</Button>
    </Controls>
  );
}
Playground.storyName = "Controls Playground";
Playground.args = {
  direction: "horizontal",
};
Playground.argTypes = {
  direction: {
    control: "select",
    options: ["horizontal", "vertical"],
  },
};
Playground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xs",
  },
};

export default {
  title: "Organism/Containers/Controls",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
