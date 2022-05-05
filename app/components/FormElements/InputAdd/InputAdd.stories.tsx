import { ComponentStory, ComponentMeta } from "@storybook/react";
import InputAdd, { InputAddProps } from "./InputAdd";

export default {
  title: "InputAdd",
  component: InputAdd,
} as ComponentMeta<typeof InputAdd>;

export const Default: ComponentStory<typeof InputAdd> = (
  args: InputAddProps
) => <InputAdd {...args} />;
Default.storyName = "default";
Default.args = {};
