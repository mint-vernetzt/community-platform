import type { ComponentStory, ComponentMeta } from "@storybook/react";
import type { AutocompleteProps } from "./Autocomplete";
import Autocomplete from "./Autocomplete";

export default {
  title: "Autocomplete",
  component: Autocomplete,
} as ComponentMeta<typeof Autocomplete>;

export const Default: ComponentStory<typeof Autocomplete> = (
  args: AutocompleteProps
) => (
  <Autocomplete
    {...args}
    suggestions={[]}
    suggestionsLoaderPath=""
    defaultValue=""
    searchParameter=""
  />
);

Default.storyName = "default";
Default.args = {};

export const WithOrganizationInput: ComponentStory<typeof Autocomplete> = (
  args: AutocompleteProps
) => (
  <Autocomplete
    {...args}
    suggestions={[
      {
        name: "Some Organization",
        logo: null,
        id: "d38bf195-ec57-46a9-918e-8035436c0069",
        types: [
          {
            organizationType: {
              slug: "some-organization-type-slug",
            },
          },
          {
            organizationType: {
              slug: "another-organization-type-slug",
            },
          },
        ],
      },
      {
        name: "Another Organization",
        logo: null,
        id: "45eb6867-9b9f-4384-860a-78496b86e089",
        types: [
          {
            organizationType: {
              slug: "some-organization-type-slug",
            },
          },
          {
            organizationType: {
              slug: "another-organization-type-slug",
            },
          },
        ],
      },
    ]}
    suggestionsLoaderPath="/some/loader/path/to/get/suggestions"
    defaultValue="organi"
    searchParameter="autocomplete_query"
  />
);

WithOrganizationInput.storyName = "withOrganizationInput";
WithOrganizationInput.args = {};

export const WithProfileInput: ComponentStory<typeof Autocomplete> = (
  args: AutocompleteProps
) => (
  <Autocomplete
    {...args}
    suggestions={[
      {
        firstName: "Friendly",
        lastName: "Gardener",
        avatar: null,
        id: "ced1a004-2105-41b4-b020-f9891f344428",
        position: "Chief of Gardening",
      },
      {
        firstName: "Mad",
        lastName: "Gardener",
        avatar: null,
        id: "735db8cb-3c7b-497b-8e0b-5e85d81ad84c",
        position: "Executive Gardener",
      },
    ]}
    suggestionsLoaderPath="/some/loader/path/to/get/suggestions"
    defaultValue="garden"
    searchParameter="autocomplete_query"
  />
);

WithProfileInput.storyName = "withProfileInput";
WithProfileInput.args = {};
