import type { ButtonProps } from "./Button";
import Button from "./Button";

export function Small() {
  return <Button size="small">Button</Button>;
}
Small.storyName = "primary-small";
export function Medium() {
  return <Button>Button</Button>;
}
Medium.storyName = "primary-medium";

export function Large() {
  return <Button size="large">Button</Button>;
}
Large.storyName = "primary-large";

export function LoadingMedium() {
  return <Button loading>Button</Button>;
}
LoadingMedium.storyName = "primary-medium-loading";

export function DisabledMedium() {
  return <Button disabled>Button</Button>;
}
DisabledMedium.storyName = "primary-medium-disabled";

export function GhostMedium() {
  return <Button variant="ghost">Button</Button>;
}
GhostMedium.storyName = "ghost-medium";

export function SecondaryMedium() {
  return <Button variant="secondary">Button</Button>;
}
SecondaryMedium.storyName = "secondary-medium";

function ButtonVariants({
  level,
  variant,
}: {
  level: ButtonProps["level"];
  variant: ButtonProps["variant"];
}) {
  return (
    <div className="flex gap-2 items-center">
      <Button size="small" level={level} variant={variant}>
        Button
      </Button>
      <Button level={level} variant={variant}>
        Button
      </Button>
      <Button size="large" level={level} variant={variant}>
        Button
      </Button>
      <Button loading size="small" level={level} variant={variant}>
        Button
      </Button>
      <Button loading level={level} variant={variant}>
        Button
      </Button>
      <Button loading size="large" level={level} variant={variant}>
        Button
      </Button>
      <Button disabled size="small" level={level} variant={variant}>
        Button
      </Button>
      <Button disabled level={level} variant={variant}>
        Button
      </Button>
      <Button disabled size="large" level={level} variant={variant}>
        Button
      </Button>
    </div>
  );
}

export function Variants() {
  return (
    <div className="flex flex-col gap-2">
      <ButtonVariants variant="primary" level="normal" />
      <ButtonVariants variant="primary" level="success" />
      <ButtonVariants variant="primary" level="warning" />
      <ButtonVariants variant="primary" level="danger" />
      <ButtonVariants variant="secondary" level="normal" />
      <ButtonVariants variant="secondary" level="success" />
      <ButtonVariants variant="secondary" level="warning" />
      <ButtonVariants variant="secondary" level="danger" />
      <ButtonVariants variant="ghost" level="normal" />
      <ButtonVariants variant="ghost" level="success" />
      <ButtonVariants variant="ghost" level="warning" />
      <ButtonVariants variant="ghost" level="danger" />
    </div>
  );
}

export function ButtonPlayground(args: ButtonProps) {
  return <Button {...args}>Button</Button>;
}
ButtonPlayground.storyName = "Playground";
ButtonPlayground.args = {
  size: "medium",
  variant: "primary",
  level: "normal",
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
    options: ["normal", "success", "warning", "danger"],
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
