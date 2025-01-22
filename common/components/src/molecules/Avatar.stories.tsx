import type { AvatarProps, MoreIndicatorProps } from "./Avatar";
import Avatar, { AvatarList, MoreIndicator } from "./Avatar";

type AvatarPlaygroundProps = {
  firstName: string;
  lastName: string;
  avatar?: string;
  size?: AvatarProps["size"];
};

export function MoreIndicatorPlayground(props: MoreIndicatorProps) {
  return <MoreIndicator {...props} />;
}
MoreIndicatorPlayground.storyName = "More Indicator";
MoreIndicatorPlayground.args = {
  amount: 1,
};
MoreIndicatorPlayground.parameters = {
  controls: { disable: false },
};

type AvatarListPlaygroundProps = {
  visibleAvatars: number;
};

export function AvatarListPlayground(props: AvatarListPlaygroundProps) {
  const teamMembers = [
    {
      firstName: "Maria",
      lastName: "Lupan",
      username: "marialupan",
      avatar: "./maria-lupan-fE5IaNta2KM-unsplash.jpg",
    },
    {
      firstName: "Jonas",
      lastName: "Kakaroto",
      username: "jonaskakaroto",
      avatar: "./jonas-kakaroto-KIPqvvTOC1s-unsplash.jpg",
    },
    {
      firstName: "Toa",
      lastName: "Heftiba",
      username: "toaheftiba",
      avatar: "./toa-heftiba-O3ymvT7Wf9U-unsplash.jpg",
    },
    {
      firstName: "Behrouz",
      lastName: "Sasani",
      username: "behrouzsasani",
      avatar: "./behrouz-sasani-XYY5KE1NH84-unsplash.jpg",
    },
    {
      firstName: "Maria",
      lastName: "Lupan",
      username: "marialupan",
    },
    {
      firstName: "Jonas",
      lastName: "Kakaroto",
      username: "jonaskakaroto",
    },
    {
      firstName: "Toa",
      lastName: "Heftiba",
      username: "toaheftiba",
    },
    {
      firstName: "Behrouz",
      lastName: "Sasani",
      username: "behrouzsasani",
    },
  ];

  return (
    <AvatarList {...props}>
      {teamMembers.map((item) => (
        <Avatar key={item.username} {...item} />
      ))}
    </AvatarList>
  );
}
AvatarListPlayground.storyName = "Avatar List";
AvatarListPlayground.args = {
  visibleAvatars: 2,
};
AvatarListPlayground.parameters = {
  controls: { disable: false },
};

export function AvatarPlayground(props: AvatarPlaygroundProps) {
  const { avatar, ...otherProps } = props;
  return (
    <div className="mv-w-[248px]">
      <Avatar avatar={avatar === "" ? undefined : avatar} {...otherProps} />
    </div>
  );
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
    options: ["sm", "md", "lg", "xl", "full"],
  },
  textSize: {
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
