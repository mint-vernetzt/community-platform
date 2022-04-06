import { ComponentStory, ComponentMeta } from "@storybook/react";
import HeaderLogo from "./HeaderLogo";

export default {
  title: "HeaderLogo",
  component: HeaderLogo,
} as ComponentMeta<typeof HeaderLogo>;

export const Default: ComponentStory<typeof HeaderLogo> = () => <HeaderLogo />;

Default.storyName = "default";
Default.parameters = { controls: { hideNoControlsWarning: true } };
