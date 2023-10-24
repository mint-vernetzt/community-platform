import Chip from "./Chip";

type ChipPlaygroundProps = {
  title: string;
};

export function ChipVariantsStory() {
  return (
    <div className="mv-flex mv-flex-col mv-gap-4">
      <div className="mv-flex mv-flex-row mv-gap-4">
        <Chip>Chip</Chip>
        <Chip removable>removable Chip</Chip>
        <Chip interactive>
          <button onClick={() => console.log("primary click")}>
            wrapped Chip
          </button>
        </Chip>
        <Chip disabled>disabled Chip</Chip>
        <Chip responsive>Chip</Chip>
      </div>
      <div className="mv-flex mv-flex-row mv-gap-4">
        <Chip color="secondary">Chip</Chip>
        <Chip color="secondary" removable>
          removable Chip
        </Chip>
        <Chip color="secondary" interactive>
          <button onClick={() => console.log("secondary click")}>
            wrapped Chip
          </button>
        </Chip>
        <Chip color="secondary" disabled>
          disabled Chip
        </Chip>
        <Chip color="secondary" responsive>
          Chip
        </Chip>
      </div>
    </div>
  );
}

ChipVariantsStory.storyName = "variants";

export function ChipPlayground(props: ChipPlaygroundProps) {
  const { title, ...otherProps } = props;
  return <Chip {...otherProps}>{title}</Chip>;
}
ChipPlayground.args = {
  title: "Title",
  color: "primary",
  interactive: false,
  removable: false,
  disabled: false,
  responsive: false,
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
