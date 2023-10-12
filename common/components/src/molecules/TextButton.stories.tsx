import TextButton from "./TextButton";

export function TextButtonPlayground() {
  return (
    <div className="mv-flex mv-flex-col">
      <TextButton size="large">Text Button Large</TextButton>
      <TextButton>Text Button</TextButton>
      <TextButton size="small">Text Button small</TextButton>
      <TextButton arrowLeft arrowRight size="large">
        Text Button Large
      </TextButton>
      <TextButton arrowLeft>Text Button</TextButton>
      <TextButton arrowLeft size="small">
        Text Button small
      </TextButton>
      <TextButton weight="thin" arrowLeft size="large">
        Text Button Large
      </TextButton>
      <TextButton weight="thin" arrowLeft>
        Text Button
      </TextButton>
      <TextButton weight="thin" arrowLeft size="small">
        Text Button small
      </TextButton>
      <TextButton variant="neutral" size="large">
        Text Button Large neutral
      </TextButton>
      <TextButton variant="neutral">Text Button neutral</TextButton>
      <TextButton variant="neutral" size="small">
        Text Button small neutral
      </TextButton>
      <TextButton arrowLeft variant="neutral" size="large">
        Text Button Large neutral
      </TextButton>
      <TextButton arrowLeft variant="neutral">
        Text Button neutral
      </TextButton>
      <TextButton arrowLeft variant="neutral" size="small">
        Text Button small neutral
      </TextButton>
    </div>
  );
}
TextButtonPlayground.storyName = "Playground";
TextButtonPlayground.args = {};
TextButtonPlayground.argTypes = {};
TextButtonPlayground.parameters = {
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
