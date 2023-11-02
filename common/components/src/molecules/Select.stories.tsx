import { ComponentStory, ComponentMeta } from "@storybook/react";
import SearchInput, { SearchInputProps } from "./SearchInput";

export default {
  title: "Molecules/Formelements/Search Input",
  component: SearchInput,
} as ComponentMeta<typeof SearchInput>;

export const Default: ComponentStory<typeof SearchInput> = (
  args: SearchInputProps
) => <SearchInput {...args} />;
Default.storyName = "default";
Default.args = {};
