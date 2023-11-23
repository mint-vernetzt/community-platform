import Toast, { type ToastLevel } from "./Toast";

export function ToastPlayground(props: {
  text: string;
  delay: number;
  variant: ToastLevel;
}) {
  const { text, ...otherProps } = props;
  return (
    <div className="mv-m-2">
      {/* key with date now forces remounting (needed to force empty dependency effects) */}
      <Toast key={Date.now().toString()} {...otherProps}>
        {text}
      </Toast>
    </div>
  );
}
ToastPlayground.storyName = "Playground";
ToastPlayground.args = {
  text: "Toast",
  variant: "positive",
  delay: 2000,
};
ToastPlayground.argTypes = {
  text: {
    control: "text",
  },
  variant: {
    control: "select",
    options: ["positive", "attention", "negative"],
  },
  delay: {
    control: "number",
  },
};

ToastPlayground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Molecules/Toast",
  component: Toast,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
