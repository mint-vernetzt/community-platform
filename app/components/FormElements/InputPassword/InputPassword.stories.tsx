import { ComponentStory, ComponentMeta } from "@storybook/react";
import InputPassword from "./InputPassword";

export default {
  title: "FormElements/InputPassword",
  component: InputPassword,
} as ComponentMeta<typeof InputPassword>;

export const Default: ComponentStory<typeof InputPassword> = () => (
  <InputPassword />
);
Default.storyName = "default";
