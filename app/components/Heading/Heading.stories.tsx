import { type Story, type Meta } from "@storybook/react";
import type { HeadingProps } from "./Heading";
import Heading, { H1, H2, H3, H4, H5, H6 } from "./Heading";
import React from "react";

export default {
  title: "Components/Heading",
} as Meta;

export const Playground: Story<{ changeStyle: boolean } & HeadingProps> = (
  args
) => {
  const { changeStyle, like, ...otherArgs } = args;
  const ref = React.createRef<HTMLHeadingElement>();
  return (
    <Heading like={changeStyle ? like : undefined} {...otherArgs} ref={ref} />
  );
};

const defaultText =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n,./:()!?#@&0123456789";

Playground.args = {
  children: defaultText,
  as: "h1",
  like: "h1",
};

Playground.argTypes = {
  as: {
    options: ["h1", "h2", "h3", "h4", "h5", "h6"],
    control: { type: "select" },
    defaultValue: "h1",
  },
  like: {
    options: ["h0", "h1", "h2", "h3", "h4", "h5", "h6"],
    control: { type: "select" },
    defaultValue: "h0",
  },
  changeStyle: {
    name: "enable style change",
    control: { type: "boolean" },
    defaultValue: false,
  },
};

Playground.storyName = "playground";

export const Variants: Story = () => {
  return (
    <>
      <H1 like="h0">h0: Hero Heading</H1>
      <H1>h1: Heading</H1>
      <H2>h2: Component and layout heading</H2>
      <H3>h3: Component and layout heading</H3>
      <H4>h4: Component and layout heading</H4>
      <H5>h5: Component and layout heading</H5>
      <H6>h6: Component and layout heading</H6>
      <div className="mt-8">
        <span>Special: h5 after h0 isn't bold</span>
        <H1 like="h0">h0: Hero Heading</H1>
        <H5>h5: Component and layout heading</H5>
      </div>
    </>
  );
};

Variants.parameters = {
  controls: { disable: true },
};

Variants.storyName = "variants";
