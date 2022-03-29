import { ComponentStory, ComponentMeta } from "@storybook/react";
import SelectField from "./SelectField";

export default {
  title: "FormElements/SelectField",
  component: SelectField,
} as ComponentMeta<typeof SelectField>;

export const Default: ComponentStory<typeof SelectField> = () => <SelectField/>;
Default.storyName = "default";