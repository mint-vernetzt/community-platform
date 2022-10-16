import { ComponentStory, ComponentMeta } from "@storybook/react";
import ProfileCard, { ProfileCardProps } from "./ProfileCard";

export default {
  title: "ProfileCard",
  component: ProfileCard,
} as ComponentMeta<typeof ProfileCard>;

export const Default: ComponentStory<typeof ProfileCard> = (
  args: ProfileCardProps
) => <ProfileCard {...args} />;
Default.storyName = "default";
Default.args = {};
