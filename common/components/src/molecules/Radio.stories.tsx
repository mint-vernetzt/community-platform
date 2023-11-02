import { ComponentStory, ComponentMeta } from "@storybook/react";
import Radio, { RadioProps } from "./Radio";

export default {
  title: "Molecules/Formelements/Radio",
  component: Radio,
} as ComponentMeta<typeof Radio>;

export const Default: ComponentStory<typeof Radio> = (args: RadioProps) => (
  <Radio {...args} />
);
Default.storyName = "default";
Default.args = {};
