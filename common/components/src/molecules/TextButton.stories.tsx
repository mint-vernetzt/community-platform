import React from "react";
import { TextButton, type TextButtonProps } from "./TextButton";

type TextButtonPlaygroundArgs = TextButtonProps & {
  onClick?: () => void;
  text: string;
};

export function AsWrapperPlayground(props: TextButtonPlaygroundArgs) {
  const { text, ...otherProps } = props;
  return (
    <TextButton {...otherProps}>
      <button>{text}</button>
    </TextButton>
  );
}
AsWrapperPlayground.storyName = "Playground (as wrapper)";
AsWrapperPlayground.args = {
  size: "normal",
  variant: "primary",
  weight: "normal",
  text: "Text Button",
  arrowLeft: false,
  arrowRight: false,
};
AsWrapperPlayground.argTypes = {
  size: {
    control: "select",
    options: ["large", "normal", "small"],
    default: "normal",
  },
  variant: {
    control: "select",
    options: ["primary", "neutral"],
    default: "primary",
  },
  weight: {
    control: "select",
    options: ["thin", "normal"],
    default: "normal",
  },
};
AsWrapperPlayground.parameters = {
  controls: { disable: false },
};

export function AsLinkPlayground(args: TextButtonPlaygroundArgs) {
  const { text, ...otherProps } = args;
  return (
    <TextButton
      {...otherProps}
      as="a"
      target="__blank"
      rel="noopener noreferrer"
    >
      {text}
    </TextButton>
  );
}
AsLinkPlayground.storyName = "Playground (as link)";
AsLinkPlayground.args = {
  size: "normal",
  variant: "primary",
  weight: "normal",
  text: "Text Button",
  href: "https://github.com/mint-vernetzt/community-platform",
  arrowLeft: false,
  arrowRight: false,
};
AsLinkPlayground.argTypes = {
  size: {
    control: "select",
    options: ["large", "normal", "small"],
    default: "normal",
  },
  variant: {
    control: "select",
    options: ["primary", "neutral"],
  },
  weight: {
    control: "select",
    options: ["thin", "normal"],
  },
};
AsLinkPlayground.parameters = {
  controls: { disable: false },
};

export function AsButtonPlayground(args: TextButtonPlaygroundArgs) {
  const [count, setCount] = React.useState(0);

  const handleClick = () => {
    setCount(count + 1);
  };

  const { text, ...otherProps } = args;
  return (
    <div>
      <TextButton {...otherProps} as="button" onClick={handleClick}>
        {text}
      </TextButton>
      clicked {count} times
    </div>
  );
}
AsButtonPlayground.storyName = "Playground (as button)";
AsButtonPlayground.args = {
  size: "normal",
  variant: "primary",
  weight: "normal",
  text: "Text Button",
  arrowLeft: false,
  arrowRight: false,
};
AsButtonPlayground.argTypes = {
  size: {
    control: "select",
    options: ["large", "normal", "small"],
    default: "normal",
  },
  variant: {
    control: "select",
    options: ["primary", "neutral"],
  },
  weight: {
    control: "select",
    options: ["thin", "normal"],
  },
};
AsButtonPlayground.parameters = {
  controls: { disable: false },
};

export default {
  title: "Molecules/Text Button",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
