import { Video } from "./Video";

type VideoPlaygroundProps = {
  src: string;
  subline: string;
};

export function VideoPlayground(props: VideoPlaygroundProps) {
  return (
    <Video src={props.src}>
      {typeof props.subline !== "undefined" && props.subline === "" && (
        <Video.Subline>{props.subline}</Video.Subline>
      )}
    </Video>
  );
}
VideoPlayground.storyName = "Playground";
VideoPlayground.args = {
  src: "https://www.youtube-nocookie.com/embed/aDaOgu2CQtI",
  subline: "Pearl Jam - Do the Evolution (Official Video)",
};

VideoPlayground.argTypes = {
  src: {
    control: {
      type: "text",
    },
  },
  subline: {
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
