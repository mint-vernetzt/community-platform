import Chip from "./Chip";

type ChipPlaygroundProps = {
  title: string;
};

export function ChipPlayground(props: ChipPlaygroundProps) {
  const { title, ...otherProps } = props;
  return <Chip {...otherProps}>{title}</Chip>;
}
ChipPlayground.args = {
  title: "Title",
  color: "primary",
};
ChipPlayground.argTypes = {
  title: {
    control: "text",
  },
  color: {
    control: "select",
    options: ["primary", "secondary"],
  },
};
ChipPlayground.storyName = "Playground";
ChipPlayground.parameters = {
  controls: { disable: false },
};

export default {
  title: "Molecules/Chip",
  component: Chip,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
