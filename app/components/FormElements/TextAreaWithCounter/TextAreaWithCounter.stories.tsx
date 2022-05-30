import { ComponentStory, ComponentMeta } from "@storybook/react";
import TextAreaWithCounter, {
  TextAreaWithCounterProps,
} from "./TextAreaWithCounter";

export default {
  title: "FormElements/TextAreaWithCounter",
  component: TextAreaWithCounter,
} as ComponentMeta<typeof TextAreaWithCounter>;

export const Default: ComponentStory<typeof TextAreaWithCounter> = (
  args: TextAreaWithCounterProps
) => <TextAreaWithCounter {...args} />;
Default.storyName = "default";
Default.args = {};
