import { ComponentStory, ComponentMeta } from "@storybook/react";
import InputText from "./InputText";

export default {
  title: "FormElements/InputText",
  component: InputText,
} as ComponentMeta<typeof InputText>;

export const Default: ComponentStory<typeof InputText> = () => <InputText />;
Default.storyName = "default";
