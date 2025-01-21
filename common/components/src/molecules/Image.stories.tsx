import classNames from "classnames";
import { Image, type ImageProps } from "./Image";

type ImagePlaygroundProps = {
  imageAspect: AspectType;
  containerAspect: AspectType;
  resizeType: ImageProps["resizeType"];
  blurredBackground: boolean;
};

type AspectType = "landscape" | "portrait" | "equal";

export function Playground(props: ImagePlaygroundProps) {
  let src, blurredSrc;
  if (props.imageAspect === "landscape") {
    src = "./bla_giesserstrasse_12a-1512x1080.jpg";
    blurredSrc = "./bla_giesserstrasse_12a-1512x1080-blurred.jpg";
  } else if (props.imageAspect === "portrait") {
    src = "./toa-heftiba-O3ymvT7Wf9U-unsplash.jpg";
    blurredSrc = "./toa-heftiba-O3ymvT7Wf9U-unsplash-blurred.jpg";
  } else {
    src = "./hochschulefulda-logo.jpeg";
    blurredSrc = "./hochschulefulda-logo-blurred.jpg";
  }

  const classes = classNames(
    "mv-w-full",
    props.containerAspect === "landscape" && "mv-aspect-[16/9]",
    props.containerAspect === "portrait" && "mv-aspect-[2/3]",
    props.containerAspect === "equal" && "mv-aspect-[1]"
  );
  return (
    <div className={classes}>
      <Image
        src={src}
        blurredSrc={props.blurredBackground ? blurredSrc : undefined}
        alt="Haus an der Giesserstrasse 12a in Leipzig in Schwarz Weiß"
        resizeType={props.resizeType}
      />
    </div>
  );
}
Playground.storyName = "Image Playground";
Playground.args = {
  imageAspect: "landscape",
  containerAspect: "landscape",
  blurredBackground: true,
  resizeType: "fill",
};
Playground.argTypes = {
  imageAspect: {
    control: "select",
    options: ["landscape", "portrait", "equal"],
  },
  containerAspect: {
    control: "select",
    options: ["landscape", "portrait", "equal"],
  },
  resizeType: {
    control: "select",
    options: ["fill", "fit"],
  },
};
Playground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xs",
  },
};

export default {
  title: "Molecules/Image",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
