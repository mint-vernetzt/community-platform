import { ComponentStory, ComponentMeta } from "@storybook/react";
import PasswordReset, { PasswordResetProps } from "./PasswordReset";

export default {
  title: "Pages/PasswordReset",
  component: PasswordReset,
} as ComponentMeta<typeof PasswordReset>;

export const Default: ComponentStory<typeof PasswordReset> = (
  args: PasswordResetProps
) => <PasswordReset {...args} />;
Default.storyName = "default";
Default.args = {};
