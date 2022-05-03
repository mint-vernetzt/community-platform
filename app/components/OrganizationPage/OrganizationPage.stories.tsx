import { ComponentStory, ComponentMeta } from "@storybook/react";
import OrganizationPage, { OrganizationPageProps } from "./OrganizationPage";

export default {
  title: "Profile/OrganizationPage",
  component: OrganizationPage,
} as ComponentMeta<typeof ProfilePage>;

export const Default: ComponentStory<typeof OrganizationPage> = (
  args: OrganizationPageProps
) => <OrganizationPage {...args} />;
Default.storyName = "default";
Default.args = {};
