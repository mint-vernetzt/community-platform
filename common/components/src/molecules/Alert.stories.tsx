import Alert from "./Alert";

type AlertProps = {
  message: string;
};

export function AlertPlayground(props: AlertProps) {
  const { message, ...otherProps } = props;
  return <Alert {...otherProps}>{message}</Alert>;
}
AlertPlayground.args = {
  message: "Alert message",
};
AlertPlayground.argTypes = {
  message: {
    control: "text",
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
