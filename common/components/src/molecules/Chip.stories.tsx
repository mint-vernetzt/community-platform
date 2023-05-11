import Chip from "./Chip";

type ChipPlaygroundProps = {
  title: string;
};

export function ChipPlayground(props: ChipPlaygroundProps) {
  const { title } = props;
  return <Chip>{title}</Chip>;
}
ChipPlayground.args = {
  title: "Title",
};
ChipPlayground.argTypes = {
  title: {
    control: "text",
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
