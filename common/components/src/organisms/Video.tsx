import { Button } from "@mint-vernetzt/components";
import React from "react";

export type VideoProps = {
  src: string;
};

function Video(props: VideoProps) {
  const [cookiesAccepted, setCookiesAccepted] = React.useState(false);

  const handleClick = () => {
    setCookiesAccepted(true);
  };

  return (
    <div className="mv-w-full mv-aspect-video">
      <div className="mv-w-full mv-h-full mv-bg-primary-400 mv-flex mv-flex-col mv-justify-center mv-items-center mv-gap-4">
        {!cookiesAccepted ? (
          <>
            <Button variant="outline" onClick={handleClick}>
              Video von YouTube ansehen
            </Button>
            <p className="mv-text-white mv-text-sm md:mv-text-base mv-text-center mv-px-4">
              Wenn Du auf den Button klickst, lässt Du Cookies von YouTube zu.
            </p>
          </>
        ) : (
          <iframe
            width="100%"
            height="100%"
            src={props.src}
            title="YouTube video player"
            frameBorder="0"
            allow=""
            allowFullScreen
          ></iframe>
        )}
      </div>
    </div>
  );
}

export default Video;
