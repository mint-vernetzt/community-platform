import { ComponentStory, ComponentMeta } from "@storybook/react";
import ExternalServiceIcon, {
  ExternalServiceProps,
} from "./ExternalServiceIcon";

export default {
  title: "ExternalServiceIcon",
  component: ExternalServiceIcon,
} as ComponentMeta<typeof ExternalServiceIcon>;

export const Default: ComponentStory<typeof ExternalServiceIcon> = (
  args: ExternalServiceProps
) => <ExternalServiceIcon {...args} />;
Default.storyName = "default";
Default.args = {};
