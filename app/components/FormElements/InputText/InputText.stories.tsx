import { ComponentStory, ComponentMeta } from "@storybook/react";
import InputText, { InputTextProps } from "./InputText";

export default {
  title: "FormElements/InputText",
  component: InputText,
} as ComponentMeta<typeof InputText>;

export const Default: ComponentStory<typeof InputText> = (
  args: InputTextProps
) => <InputText {...args} />;

Default.storyName = "default";

Default.args = {
  label: "Label",
  isRequired: false,
  placeholder: "Placeholder",
  id: "input",
};
