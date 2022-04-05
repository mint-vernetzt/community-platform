import { ComponentStory, ComponentMeta } from "@storybook/react";
import PageBackground from "./PageBackground";

export default {
  title: "PageBackground",
  component: PageBackground,
} as ComponentMeta<typeof PageBackground>;

export const Default: ComponentStory<typeof PageBackground> = () => (
  <PageBackground />
);

Default.storyName = "default";
Default.parameters = { controls: { hideNoControlsWarning: true } };
