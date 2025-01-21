import { CircleButton, type CircleButtonProps } from "./CircleButton";

export function CircleButtonPlayground(props: CircleButtonProps) {
  return <CircleButton {...props}>A</CircleButton>;
}
CircleButtonPlayground.storyName = "Playground";
CircleButtonPlayground.args = {
  variant: "normal",
  size: "medium",
  disabled: false,
  floating: false,
};
CircleButtonPlayground.argTypes = {
  variant: {
    control: "select",
    options: ["normal", "outline", "ghost"],
  },
  size: {
    control: "select",
    options: ["small", "medium", "large"],
  },
};
CircleButtonPlayground.parameters = {
  controls: { disable: false },
};

export default {
  title: "Molecules/Circle Button",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
