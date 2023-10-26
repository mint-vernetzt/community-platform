import Status, { type StatusProps } from "./Status";

type StatusPlaygroundProps = {
  variant: StatusProps["variant"];
  inverted: StatusProps["inverted"];
  statusText: string;
};

export function Playground(props: StatusPlaygroundProps) {
  return (
    <Status variant={props.variant} inverted={props.inverted}>
      {props.statusText}
    </Status>
  );
}
Playground.storyName = "Status Playground";
Playground.args = {
  variant: "primary",
  inverted: false,
  statusText: "Status",
};
Playground.argTypes = {
  variant: {
    control: "select",
    options: ["primary", "neutral", "positive", "negative"],
  },
  statusText: {
    control: "text",
  },
};
Playground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xs",
  },
};

export default {
  title: "Molecules/Status",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
