import { ComponentStory, ComponentMeta } from "@storybook/react";
import Select, { SelectProps } from "./Select";

export default {
  title: "Molecules/Formelements/Select",
  component: Select,
} as ComponentMeta<typeof Select>;

export const Default: ComponentStory<typeof Select> = (args: SelectProps) => (
  <Select {...args} />
);
Default.storyName = "default";
Default.args = {};
