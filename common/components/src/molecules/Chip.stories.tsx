import { Chip, type ChipColor } from "./Chip";

export function ChipVariantsStory(props: { responsive: boolean }) {
  return (
    <div className="mv-flex mv-flex-col mv-gap-4">
      <Chip.Container>
        <Chip responsive={props.responsive}>Chip</Chip>
        <Chip responsive={props.responsive}>
          Chip with delete{" "}
          <Chip.Delete>
            <button onClick={() => console.log("delete click")}>Delete</button>
          </Chip.Delete>
        </Chip>
        <Chip interactive responsive={props.responsive}>
          <button onClick={() => console.log("interactive click")}>
            Chip with interaction
          </button>
        </Chip>
        <Chip interactive responsive={props.responsive}>
          <button onClick={() => console.log("interactive click")}>
            Chip with interaction and delete
          </button>
          <Chip.Delete>
            <button onClick={() => console.log("delete click")}>Delete</button>
          </Chip.Delete>
        </Chip>
        <Chip interactive disabled responsive={props.responsive}>
          <button onClick={() => console.log("interactive click")}>
            Chip with interaction and delete (disabled)
          </button>
          <Chip.Delete>
            <button onClick={() => console.log("delete click")}>Delete</button>
          </Chip.Delete>
        </Chip>
      </Chip.Container>
      <Chip.Container>
        <Chip color="secondary" responsive={props.responsive}>
          Chip
        </Chip>
        <Chip color="secondary" responsive={props.responsive}>
          Chip with delete{" "}
          <Chip.Delete>
            <button onClick={() => console.log("delete click")}>Delete</button>
          </Chip.Delete>
        </Chip>
        <Chip color="secondary" interactive responsive={props.responsive}>
          <button onClick={() => console.log("interactive click")}>
            Chip with interaction
          </button>
        </Chip>
        <Chip color="secondary" interactive responsive={props.responsive}>
          <button onClick={() => console.log("interactive click")}>
            Chip with interaction and delete
          </button>
          <Chip.Delete>
            <button onClick={() => console.log("delete click")}>Delete</button>
          </Chip.Delete>
        </Chip>
        <Chip
          color="secondary"
          interactive
          disabled
          responsive={props.responsive}
        >
          <button onClick={() => console.log("interactive click")}>
            Chip with interaction and delete (disabled)
          </button>
          <Chip.Delete>
            <button onClick={() => console.log("delete click")}>Delete</button>
          </Chip.Delete>
        </Chip>
      </Chip.Container>
    </div>
  );
}

ChipVariantsStory.storyName = "variants";
ChipVariantsStory.args = {
  responsive: false,
};
ChipVariantsStory.argTypes = {
  responsive: {
    control: "boolean",
  },
};
ChipVariantsStory.parameters = {
  controls: { disable: false },
};

type ChipPlaygroundProps = {
  title: string;
  color: ChipColor;
  interactive: boolean;
  deletable: boolean;
  disabled: boolean;
  responsive: boolean;
};

export function ChipPlayground(props: ChipPlaygroundProps) {
  const { title, deletable, ...otherProps } = props;
  return (
    <Chip {...otherProps}>
      {title}
      {deletable && (
        <Chip.Delete>
          <button onClick={() => console.log("delete click")}>Delete</button>
        </Chip.Delete>
      )}
    </Chip>
  );
}
ChipPlayground.args = {
  title: "Title",
  color: "primary",
  interactive: false,
  deletable: false,
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
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
