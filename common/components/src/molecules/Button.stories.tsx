import type { ButtonLevel, ButtonProps, ButtonSize } from "./Button";
import Button from "./Button";

function Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="mv-h-6 mv-w-6" // TODO: implement flexible svg handling
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

// function ButtonVariants(props: { size: ButtonProps["size"] }) {
//   const { size } = props;
//   return (
//     <div className="mv-flex mv-gap-2 mv-flex-col">
//       <div className="mv-flex mv-gap-2">
//         <Button size={size}>Button</Button>
//         <Button size={size} level="negative">
//           Button
//         </Button>
//         <Button size={size}>
//           <Icon />
//           Button
//         </Button>
//         <Button size={size}>
//           Button
//           <Icon />
//         </Button>
//         <Button size={size} loading>
//           Button
//         </Button>
//         <Button size={size} disabled>
//           Button
//         </Button>
//       </div>
//       <div className="mv-flex mv-gap-2">
//         <Button variant="outline" size={size}>
//           Button
//         </Button>
//         <Button variant="outline" size={size} level="negative">
//           Button
//         </Button>
//         <Button variant="outline" size={size}>
//           <Icon />
//           Button
//         </Button>
//         <Button variant="outline" size={size}>
//           Button
//           <Icon />
//         </Button>
//         <Button variant="outline" size={size} loading>
//           Button
//         </Button>
//         <Button variant="outline" size={size} disabled>
//           Button
//         </Button>
//       </div>
//       <div className="mv-flex mv-gap-2">
//         <Button variant="ghost" size={size}>
//           Button
//         </Button>
//         <Button variant="ghost" size={size} level="negative">
//           Button
//         </Button>
//         <Button variant="ghost" size={size}>
//           <Icon />
//           Button
//         </Button>
//         <Button variant="ghost" size={size}>
//           Button
//           <Icon />
//         </Button>
//         <Button variant="ghost" size={size} loading>
//           Button
//         </Button>
//         <Button variant="ghost" size={size} disabled>
//           Button
//         </Button>
//       </div>
//     </div>
//   );
// }
// export function Small() {
//   return <ButtonVariants size="small" />;
// }
// Small.storyName = "small";
// export function Medium() {
//   return <ButtonVariants size="medium" />;
// }
// Medium.storyName = "medium";

// export function Large() {
//   return <ButtonVariants size="large" />;
// }
// Large.storyName = "large";
type DefaultArgs = {
  size: ButtonSize;
  level: ButtonLevel;
  loading: boolean;
  disabled: boolean;
};

export function Default(args: DefaultArgs) {
  return <Button {...args}>Button</Button>;
}
Default.storyName = "default";
Default.args = {
  size: "medium",
  level: "primary",
  loading: false,
  disabled: false,
};
Default.argTypes = {
  size: {
    control: "select",
    options: ["x-small", "small", "medium", "large"],
  },
  level: {
    control: "select",
    options: ["primary", "negative"],
  },
  loading: {
    control: "boolean",
  },
};
Default.parameters = {
  controls: { disable: false },
};

type OutlineArgs = {
  size: ButtonSize;
  loading: boolean;
  disabled: boolean;
};

export function Outline(args: OutlineArgs) {
  return (
    <Button variant="outline" {...args}>
      Button
    </Button>
  );
}
Outline.storyName = "outline";
Outline.args = {
  size: "medium",
  loading: false,
  disabled: false,
};
Outline.argTypes = {
  size: {
    control: "select",
    options: ["x-small", "small", "medium", "large"],
  },
  loading: {
    control: "boolean",
  },
  disabled: {
    control: "boolean",
  },
};
Outline.parameters = {
  controls: { disable: false },
};

type GhostArgs = {
  size: ButtonSize;
  loading: boolean;
  disabled: boolean;
};

export function Ghost(args: GhostArgs) {
  return (
    <Button variant="ghost" {...args}>
      Button
    </Button>
  );
}
Ghost.storyName = "ghost";
Ghost.args = {
  size: "medium",
  loading: false,
  disabled: false,
};
Ghost.argTypes = {
  size: {
    control: "select",
    options: ["x-small", "small", "medium", "large"],
  },
  loading: {
    control: "boolean",
  },
  disabled: {
    control: "boolean",
  },
};
Ghost.parameters = {
  controls: { disable: false },
};

export function ButtonPlayground(args: ButtonProps) {
  return <Button {...args}>Button</Button>;
}
ButtonPlayground.storyName = "Playground";
ButtonPlayground.args = {
  size: "medium",
  variant: "normal",
  level: "primary",
  loading: false,
  disabled: false,
};
ButtonPlayground.argTypes = {
  size: {
    control: "select",
    options: ["x-small", "small", "medium", "large"],
  },
  variant: {
    control: "select",
    options: ["normal", "outline", "ghost"],
  },
  level: {
    control: "select",
    options: ["primary", "negative"],
  },
};
ButtonPlayground.parameters = {
  controls: { disable: false },
};

export default {
  title: "Molecules/Button",
  component: Button,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
