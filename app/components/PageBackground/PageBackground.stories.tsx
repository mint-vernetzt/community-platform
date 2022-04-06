import { ComponentStory, ComponentMeta } from "@storybook/react";
import PageBackground, { PageBackgroundProps } from "./PageBackground";

export default {
  title: "PageBackground",
  component: PageBackground,
} as ComponentMeta<typeof PageBackground>;

export const Default: ComponentStory<typeof PageBackground> = (
  args: PageBackgroundProps
) => <PageBackground {...args} />;

Default.storyName = "default";

Default.args = {
  imagePath: "/images/default_kitchen.jpg",
};
