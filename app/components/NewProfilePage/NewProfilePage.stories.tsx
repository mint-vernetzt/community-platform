import { ComponentStory, ComponentMeta } from "@storybook/react";
import NewProfilePage from "./NewProfilePage";

export default {
  title: "Pages/NewProfilePage",
  component: NewProfilePage,
} as ComponentMeta<typeof NewProfilePage>;

export const Default: ComponentStory<typeof NewProfilePage> = () => (
  <NewProfilePage />
);
Default.storyName = "default";
