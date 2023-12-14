import { type ComponentStory, type ComponentMeta } from "@storybook/react";
import SelectField, { type SelectFieldProps } from "./SelectField";

export default {
  title: "FormElements/SelectField",
  component: SelectField,
} as ComponentMeta<typeof SelectField>;

export const Default: ComponentStory<typeof SelectField> = (
  args: SelectFieldProps
) => <SelectField {...args} />;

Default.storyName = "default";
Default.args = {
  label: "Label",
  id: "select",
  required: false,
  options: [
    { label: "Option 1", value: "option 1" },
    { label: "Option 2", value: "option 2" },
    { label: "Option 3", value: "option 3" },
  ],
};
