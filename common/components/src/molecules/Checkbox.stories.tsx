import { ComponentStory, ComponentMeta } from "@storybook/react";
import Checkbox, { CheckboxProps } from "./Checkbox";

export default {
  title: "Molecules/Formelements/Checkbox",
  component: Checkbox,
} as ComponentMeta<typeof Checkbox>;

export const Default: ComponentStory<typeof Checkbox> = (
  args: CheckboxProps
) => <Checkbox {...args} />;
Default.storyName = "default";
Default.args = {};
