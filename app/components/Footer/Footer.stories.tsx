import { ComponentStory, ComponentMeta } from "@storybook/react";
import Footer, { FooterProps } from "./Footer";

export default {
  title: "Footer",
  component: Footer,
} as ComponentMeta<typeof Footer>;

export const Default: ComponentStory<typeof Footer> = (args: FooterProps) => (
  <Footer {...args} />
);
Default.storyName = "default";
Default.args = {};
