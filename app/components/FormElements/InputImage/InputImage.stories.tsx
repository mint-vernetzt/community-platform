import { ComponentStory, ComponentMeta } from "@storybook/react";
import InputImage, { InputImageProps } from "./InputImage";

export default {
  title: "InputImage",
  component: InputImage,
} as ComponentMeta<typeof InputImage>;

export const Default: ComponentStory<typeof InputImage> = (
  args: InputImageProps
) => <InputImage {...args} />;
Default.storyName = "default";
Default.args = {};
