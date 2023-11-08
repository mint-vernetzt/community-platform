import Video, { type VideoProps } from "./Video";

export function VideoPlayground(props: VideoProps) {
  return <Video src={props.src} />;
}
VideoPlayground.storyName = "Playground";
VideoPlayground.args = {
  src: "https://www.youtube-nocookie.com/embed/aDaOgu2CQtI",
};

VideoPlayground.argTypes = {
  src: {
    control: {
      type: "text",
    },
  },
};
VideoPlayground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Organism/Video",
  component: Video,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
