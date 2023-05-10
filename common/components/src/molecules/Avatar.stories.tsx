import type { AvatarProps } from "./Avatar";
import Avatar from "./Avatar";

export function AvatarPlayground(props: AvatarProps) {
  return <Avatar {...props} />;
}
AvatarPlayground.args = {
  name: "Name",
  src: "https://picsum.photos/id/433/500/500",
  size: "md",
};
AvatarPlayground.argTypes = {
  name: {
    control: "text",
  },
  src: {
    control: "text",
  },
  size: {
    control: "select",
    options: ["sm", "md", "lg", "xl"],
  },
};
AvatarPlayground.storyName = "Playground";
AvatarPlayground.parameters = {
  controls: { disable: false },
};

export default {
  title: "Molecules/Avatar",
  component: Avatar,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
