import { languageModuleMap } from "~/locales/.server";
import { Video } from "./Video";

type VideoPlaygroundProps = {
  src: string;
  subline: string;
};

export function VideoPlayground(props: VideoPlaygroundProps) {
  const locales = languageModuleMap["de"]["project/$slug/detail/about"];
  return (
    <Video src={props.src} locales={locales}>
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
