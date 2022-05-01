import { Story, Meta } from "@storybook/react";
import { Chip, ChipProps } from "./Chip";

export default {
  component: Chip,
  title: "Components/Chip",
} as Meta;

const Template: Story<ChipProps> = (args) => <Chip {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  title: "Tagname",
  slug: "tagname",
  onClick: (slug) => alert(`clicked on slug with name "${slug}"`),
};
