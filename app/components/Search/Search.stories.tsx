import type { ComponentStory, ComponentMeta } from "@storybook/react";
import type { SearchProps } from "./Search";
import Search from "./Search";

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
