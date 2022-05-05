import { ComponentStory, ComponentMeta } from "@storybook/react";
import ExploreProfiles, { ExploreProfilesProps } from "./ExploreProfiles";

export default {
  title: "Profile/ExploreProfiles",
  component: ExploreProfiles,
} as ComponentMeta<typeof ExploreProfiles>;

export const Default: ComponentStory<typeof ExploreProfiles> = (
  args: ExploreProfilesProps
) => <ExploreProfiles {...args} />;
Default.storyName = "default";
Default.args = {};
