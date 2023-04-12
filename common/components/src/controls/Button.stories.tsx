import Button from "./Button";

export function Medium() {
  return <Button>Button</Button>;
}
Medium.storyName = "primary-medium";

export function Small() {
  return <Button size="small">Button</Button>;
}
Small.storyName = "primary-small";

export function Large() {
  return <Button size="large">Button</Button>;
}
Large.storyName = "primary-large";

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
