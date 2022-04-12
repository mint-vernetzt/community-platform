import { ComponentStory, ComponentMeta } from "@storybook/react";
import NewPassword, { NewPasswordProps } from "./NewPassword";

export default {
  title: "Pages/NewPassword",
  component: NewPassword,
} as ComponentMeta<typeof NewPassword>;

export const Default: ComponentStory<typeof NewPassword> = (
  args: NewPasswordProps
) => <NewPassword {...args} />;
Default.storyName = "default";
Default.args = {};
