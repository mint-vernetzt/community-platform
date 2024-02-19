import { type ComponentStory, type ComponentMeta } from "@storybook/react";
import TextAreaWithCounter, {
  type TextAreaWithCounterProps,
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
