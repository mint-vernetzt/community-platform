import { type ComponentStory, type ComponentMeta } from "@storybook/react";
import SelectAdd, { type SelectAddProps } from "./SelectAdd";
import React from "react";

export default {
  title: "SelectAdd",
  component: SelectAdd,
} as ComponentMeta<typeof SelectAdd>;

export const Default: Omit<ComponentStory<typeof SelectAdd>, "ref"> = (
  args: SelectAddProps
) => {
  const ref = React.createRef<HTMLSelectElement>();
  return <SelectAdd {...args} ref={ref} />;
};
Default.storyName = "default";
Default.args = {};
