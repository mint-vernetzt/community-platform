import Button from "./Button";

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
  return <Button variant={"ghost"}>Button</Button>;
}
GhostMedium.storyName = "primary-medium-ghost";

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
