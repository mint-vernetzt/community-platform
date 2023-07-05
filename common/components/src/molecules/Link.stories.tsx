import Link from "./Link";

type LinkPlaygroundProps = {
  text: string;
  to: string;
  external: boolean;
};

export function LinkPlayground(props: LinkPlaygroundProps) {
  const { text, ...otherProps } = props;
  return <Link {...otherProps}>{text}</Link>;
}
LinkPlayground.storyName = "Playground";
LinkPlayground.args = {
  text: "Link",
  to: "/",
  external: false,
};
LinkPlayground.parameters = {
  controls: { disable: false },
};

export default {
  title: "Molecules/Link",
  component: Link,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
