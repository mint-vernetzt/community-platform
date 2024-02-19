import { type ComponentStory, type ComponentMeta } from "@storybook/react";
import InputPassword, { type InputPasswordProps } from "./InputPassword";

export default {
  title: "FormElements/InputPassword",
  component: InputPassword,
} as ComponentMeta<typeof InputPassword>;

export const Default: ComponentStory<typeof InputPassword> = (
  args: InputPasswordProps
) => <InputPassword {...args} />;

Default.storyName = "default";

Default.args = {
  label: "Label",
  required: false,
  id: "password",
};
