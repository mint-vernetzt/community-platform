import { ComponentStory, ComponentMeta } from "@storybook/react";
import LoginPage from "./LoginPage";

export default {
  title: "Pages/LoginPage",
  component: LoginPage,
} as ComponentMeta<typeof LoginPage>;

export const Default: ComponentStory<typeof LoginPage> = () => <LoginPage />;
Default.storyName = "default";
