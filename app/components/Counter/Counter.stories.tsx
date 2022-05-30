import { Story, Meta } from "@storybook/react";
import { Counter, CounterProps } from "./Counter";

export default {
  component: Counter,
  title: "Components/Counter",
} as Meta;

const Template: Story<CounterProps> = (args) => <Counter {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  currentCount: 0,
  maxCount: 300,
};
