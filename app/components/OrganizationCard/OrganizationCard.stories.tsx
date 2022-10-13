import { ComponentStory, ComponentMeta } from "@storybook/react";
import OrganizationCard, { OrganizationCardProps } from "./OrganizationCard";

export default {
  title: "OrganizationCard",
  component: OrganizationCard,
} as ComponentMeta<typeof OrganizationCard>;

export const Default: ComponentStory<typeof OrganizationCard> = (
  args: OrganizationCardProps
) => <OrganizationCard {...args} />;
Default.storyName = "default";
Default.args = {};
