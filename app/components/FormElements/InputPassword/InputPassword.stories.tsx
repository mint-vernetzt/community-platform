import { ComponentStory, ComponentMeta } from "@storybook/react";
import InputPassword, { InputPasswordProps } from "./InputPassword";

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
  isRequired: false,
  id: "password",
};
