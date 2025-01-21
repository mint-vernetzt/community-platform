import { Alert } from "./Alert";

type AlertProps = {
  message: string;
};

export function AlertWithHTML() {
  const html = (
    <>
      Alert message with <span className="mv-font-bold mv-underline">HTML</span>{" "}
      content
    </>
  );

  return (
    <div className="mv-flex mv-flex-col mv-gap-2">
      <Alert>{html}</Alert>
      <Alert level="attention">{html}</Alert>
      <Alert level="negative">{html}</Alert>
    </div>
  );
}

AlertWithHTML.storyName = "with HTML";

export function AlertPlayground(props: AlertProps) {
  const { message, ...otherProps } = props;
  return <Alert {...otherProps}>{message}</Alert>;
}
AlertPlayground.args = {
  message: "Alert message",
  level: "positive",
};
AlertPlayground.argTypes = {
  message: {
    control: "text",
  },
  level: {
    control: "select",
    options: ["positive", "attention", "negative"],
  },
};
AlertPlayground.storyName = "Playground";
AlertPlayground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Molecules/Alert",
  component: Alert,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
