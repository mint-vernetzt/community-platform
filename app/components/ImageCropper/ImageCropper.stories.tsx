import { type ComponentStory, type ComponentMeta } from "@storybook/react";
import ImageCropper, { type ImageCropperProps } from "./ImageCropper";

export default {
  title: "ImageCropper",
  component: ImageCropper,
} as ComponentMeta<typeof ImageCropper>;

export const Default: ComponentStory<typeof ImageCropper> = (
  args: ImageCropperProps
) => <ImageCropper {...args} />;
Default.storyName = "default";
Default.args = {};
