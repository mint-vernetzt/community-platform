import { ComponentStory, ComponentMeta } from "@storybook/react";
import SelectAdd, { SelectAddProps } from "./SelectAdd";

export default {
  title: "SelectAdd",
  component: SelectAdd,
} as ComponentMeta<typeof SelectAdd>;

export const Default: ComponentStory<typeof SelectAdd> = (
  args: SelectAddProps
) => <SelectAdd {...args} />;
Default.storyName = "default";
Default.args = {};
