import { ComponentStory, ComponentMeta } from "@storybook/react";
import EditPersonalData, { EditPersonalDataProps } from "./EditPersonalData";

export default {
  title: "Eidt Profile/EditPersonalData",
  component: EditPersonalData,
} as ComponentMeta<typeof EditPersonalData>;

export const Default: ComponentStory<typeof EditPersonalData> = (
  args: EditPersonalDataProps
) => <EditPersonalData {...args} />;
Default.storyName = "default";
Default.args = {};
