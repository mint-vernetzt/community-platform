import { type ComponentStory, type ComponentMeta } from "@storybook/react";
import TextArea, { type TextAreaProps } from "./TextArea";

export default {
  title: "FormElements/TextArea",
  component: TextArea,
} as ComponentMeta<typeof TextArea>;

export const Default: ComponentStory<typeof TextArea> = (
  args: TextAreaProps
) => <TextArea {...args} />;
Default.storyName = "default";
Default.args = {};
