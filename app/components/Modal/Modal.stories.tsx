import { ComponentStory, ComponentMeta } from "@storybook/react";
import Modal, { ModalProps } from "./Modal";

export default {
  title: "Modal",
  component: Modal,
} as ComponentMeta<typeof Modal>;

export const Default: ComponentStory<typeof Modal> = (args: ModalProps) => (
  <Modal {...args} />
);
Default.storyName = "default";
Default.args = {};
