import Button, { ButtonProps } from "./Button";

export function Small() {
  return <Button size="small">Button</Button>;
}
Small.storyName = "primary-small";
export function Medium() {
  return <Button>Button</Button>;
}
Medium.storyName = "primary-medium";

export function Large() {
  return <Button size="large">Button</Button>;
}
Large.storyName = "primary-large";

export function LoadingMedium() {
  return <Button loading>Button</Button>;
}
LoadingMedium.storyName = "primary-medium-loading";

export function DisabledMedium() {
  return <Button disabled>Button</Button>;
}
DisabledMedium.storyName = "primary-medium-disabled";

export function GhostMedium() {
  return <Button variant="ghost">Button</Button>;
}
GhostMedium.storyName = "ghost-medium";

export function SecondaryMedium() {
  return <Button variant="secondary">Button</Button>;
}
SecondaryMedium.storyName = "secondary-medium";

export function ButtonPlayground(args: ButtonProps) {
  return <Button {...args}>Button</Button>;
}
ButtonPlayground.storyName = "Playground";
ButtonPlayground.args = {
  size: "medium",
  variant: "primary",
  loading: false,
  disabled: false,
};
ButtonPlayground.argTypes = {
  size: {
    control: "select",
    options: ["small", "medium", "large"],
  },
  variant: {
    control: "select",
    options: ["primary", "secondary", "ghost"],
  },
};
ButtonPlayground.parameters = {
  controls: { disable: false },
};

export default {
  title: "Molecules/Controls/Buttons",
  component: Button,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
