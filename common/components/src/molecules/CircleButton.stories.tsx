import CircleButton, { type CircleButtonProps } from "./CircleButton";

export function CircleButtonPlayground(props: CircleButtonProps) {
  return <CircleButton {...props}>A</CircleButton>;
}
CircleButtonPlayground.storyName = "Playground";
CircleButtonPlayground.args = {
  variant: "normal",
  disabled: false,
  floating: false,
};
CircleButtonPlayground.argTypes = {
  variant: {
    control: "select",
    options: ["normal", "outline", "ghost"],
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
