import { type ComponentStory, type ComponentMeta } from "@storybook/react";
import SelectAdd, { type SelectAddProps } from "./SelectAdd";

export default {
  title: "SelectAdd",
  component: SelectAdd,
} as ComponentMeta<typeof SelectAdd>;

export const Default: ComponentStory<typeof SelectAdd> = (
  args: SelectAddProps
) => {
  return <SelectAdd {...args} />;
};
Default.storyName = "default";
Default.args = {};
