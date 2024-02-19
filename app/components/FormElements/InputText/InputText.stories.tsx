import { type ComponentStory, type ComponentMeta } from "@storybook/react";
import InputText, { type InputTextProps } from "./InputText";

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
  required: false,
  placeholder: "Placeholder",
  id: "input",
};
