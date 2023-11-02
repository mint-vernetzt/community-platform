import { ComponentStory, ComponentMeta } from "@storybook/react";
import Input, { InputProps } from "./Input";

export default {
  title: "Molecules/Formelements/Input",
  component: Input,
} as ComponentMeta<typeof Input>;

export const Default: ComponentStory<typeof Input> = (args: InputProps) => (
  <Input {...args} />
);
Default.storyName = "default";
Default.args = {};
