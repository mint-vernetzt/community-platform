import type { AvatarProps } from "./Avatar";
import Avatar from "./Avatar";

type AvatarPlaygroundProps = {
  firstName: string;
  lastName: string;
  avatar?: string;
  size?: AvatarProps["size"];
};

export function AvatarPlayground(props: AvatarPlaygroundProps) {
  const { avatar, ...otherProps } = props;
  return <Avatar avatar={avatar === "" ? undefined : avatar} {...otherProps} />;
}
AvatarPlayground.args = {
  firstName: "Sirko",
  lastName: "Kaiser",
  size: "md",
};
AvatarPlayground.argTypes = {
  firstName: {
    control: "text",
  },
  lastName: {
    control: "text",
  },
  avatar: {
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
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
