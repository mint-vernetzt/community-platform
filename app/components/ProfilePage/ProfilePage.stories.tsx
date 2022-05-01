import { ComponentStory, ComponentMeta } from "@storybook/react";
import ProfilePage, { ProfilePageProps } from "./ProfilePage";

export default {
  title: "Profile/ProfilePage",
  component: ProfilePage,
} as ComponentMeta<typeof ProfilePage>;

export const Default: ComponentStory<typeof ProfilePage> = (
  args: ProfilePageProps
) => <ProfilePage {...args} />;
Default.storyName = "default";
Default.args = {};
