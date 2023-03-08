import type { ComponentStory, ComponentMeta } from "@storybook/react";
import type { AutocompleteProps } from "./Autocomplete";
import Autocomplete from "./Autocomplete";

export default {
  title: "Autocomplete",
  component: Autocomplete,
} as ComponentMeta<typeof Autocomplete>;

export const Default: ComponentStory<typeof Autocomplete> = (
  args: AutocompleteProps
) => <Autocomplete {...args} />;

export const WithInput: ComponentStory<typeof Autocomplete> = (
  args: AutocompleteProps
) => (
  <Autocomplete
    {...args} /** TODO: insert with input props query="a search query" */
  />
);
Default.storyName = "default";
Default.args = {};
