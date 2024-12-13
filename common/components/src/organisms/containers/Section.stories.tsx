import { Section } from "./Section";

type SectionPlaygroundProps = {
  header: string;
  body: string;
  primary: boolean;
  withBorder: boolean;
  as: "div" | "section";
};

export function SectionWithItems(props: SectionPlaygroundProps) {
  const { header, body, primary, ...otherProps } = props;

  const variant = props.primary ? "primary" : undefined;

  return (
    <div className="mv-p-4">
      <Section {...otherProps} variant={variant}>
        <Section.Header>{header}</Section.Header>
        <Section.Body>{body}</Section.Body>
      </Section>
    </div>
  );
}

SectionWithItems.storyName = "Playground (with items)";
SectionWithItems.args = {
  header: "Header text",
  body: "Body text",
  primary: true,
  withBorder: true,
  as: "section",
};
SectionWithItems.argTypes = {
  header: {
    control: "text",
  },
  body: {
    control: "text",
  },
  primary: {
    control: "boolean",
  },
  withBorder: {
    control: "boolean",
  },
  as: {
    control: "select",
    options: ["div", "section"],
  },
};
SectionWithItems.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export function SectionWithoutItems(
  props: Omit<SectionPlaygroundProps, "header" | "primary">
) {
  const { body, ...otherProps } = props;

  return (
    <div className="mv-p-4">
      <Section {...otherProps}>{body}</Section>
    </div>
  );
}

SectionWithoutItems.storyName = "Playground (without items)";
SectionWithoutItems.args = {
  body: "Body text",
  withBorder: true,
  as: "section",
};
SectionWithoutItems.argTypes = {
  body: {
    control: "text",
  },
  withBorder: {
    control: "boolean",
  },
  as: {
    control: "select",
    options: ["div", "section"],
  },
};
SectionWithoutItems.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Organism/Containers/sections",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
