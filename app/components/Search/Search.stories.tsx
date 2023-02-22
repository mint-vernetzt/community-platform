import { ComponentStory, ComponentMeta } from "@storybook/react";
import Search, { SearchProps } from "./Search";

export default {
  title: "Search",
  component: Search,
} as ComponentMeta<typeof Search>;

export const Default: ComponentStory<typeof Search> = (args: SearchProps) => (
  <Search {...args} />
);

export const WithInput: ComponentStory<typeof Search> = (args: SearchProps) => (
  <Search {...args} query="a search query" />
);
Default.storyName = "default";
Default.args = {};
