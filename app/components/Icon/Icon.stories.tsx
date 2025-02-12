import { Story, Meta } from "@storybook/react";
import { Icon, IconProps, IconType } from "./Icon";

export default {
  component: Icon,
  title: "Icon",
} as Meta;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Component: Story<IconProps> = (args) => (
  <Icon type={IconType.Flag} />
);
Component.args = {
  type: IconType.Flag,
};

Component.storyName = "component";
