import type { ButtonProps } from "./Button";
import Button from "./Button";

function Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function ButtonVariants(props: { size: ButtonProps["size"] }) {
  const { size } = props;
  return (
    <div className="flex gap-2 flex-col">
      <div className="flex gap-2">
        <Button size={size}>Button</Button>
        <Button size={size} level="secondary">
          Button
        </Button>
        <Button size={size} level="success">
          Button
        </Button>
        <Button size={size} level="warning">
          Button
        </Button>
        <Button size={size} level="danger">
          Button
        </Button>
        <Button size={size}>
          <Icon />
          Button
        </Button>
        <Button size={size}>
          Button
          <Icon />
        </Button>
        <Button size={size} loading>
          Button
        </Button>
        <Button size={size} disabled>
          Button
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size={size}>
          Button
        </Button>
        <Button variant="secondary" size={size} level="secondary">
          Button
        </Button>
        <Button variant="secondary" size={size} level="success">
          Button
        </Button>
        <Button variant="secondary" size={size} level="warning">
          Button
        </Button>
        <Button variant="secondary" size={size} level="danger">
          Button
        </Button>
        <Button variant="secondary" size={size}>
          <Icon />
          Button
        </Button>
        <Button variant="secondary" size={size}>
          Button
          <Icon />
        </Button>
        <Button variant="secondary" size={size} loading>
          Button
        </Button>
        <Button variant="secondary" size={size} disabled>
          Button
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size={size}>
          Button
        </Button>
        <Button variant="ghost" size={size} level="secondary">
          Button
        </Button>
        <Button variant="ghost" size={size} level="success">
          Button
        </Button>
        <Button variant="ghost" size={size} level="warning">
          Button
        </Button>
        <Button variant="ghost" size={size} level="danger">
          Button
        </Button>
        <Button variant="ghost" size={size}>
          <Icon />
          Button
        </Button>
        <Button variant="ghost" size={size}>
          Button
          <Icon />
        </Button>
        <Button variant="ghost" size={size} loading>
          Button
        </Button>
        <Button variant="ghost" size={size} disabled>
          Button
        </Button>
      </div>
    </div>
  );
}
export function Small() {
  return <ButtonVariants size="small" />;
}
Small.storyName = "small";
export function Medium() {
  return <ButtonVariants size="medium" />;
}
Medium.storyName = "medium";

export function Large() {
  return <ButtonVariants size="large" />;
}
Large.storyName = "large";

export function ButtonPlayground(args: ButtonProps) {
  return <Button {...args}>Button</Button>;
}
ButtonPlayground.storyName = "Playground";
ButtonPlayground.args = {
  size: "medium",
  variant: "primary",
  level: "primary",
  loading: false,
  disabled: false,
};
ButtonPlayground.argTypes = {
  size: {
    control: "select",
    options: ["small", "medium", "large"],
  },
  variant: {
    control: "select",
    options: ["primary", "secondary", "ghost"],
  },
  level: {
    control: "select",
    options: ["primary", "secondary", "success", "warning", "danger"],
  },
};
ButtonPlayground.parameters = {
  controls: { disable: false },
};

export default {
  title: "Molecules/Controls/Buttons",
  component: Button,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
