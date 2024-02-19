import { Button } from "./../../index";
import React from "react";
import { useTranslation } from "react-i18next";

export type VideoProps = {
  src: string;
};

function VideoSubline(props: React.PropsWithChildren<{}>) {
  return (
    <p className="mv-text-neutral-600 mv-text-base mv-font-normal">
      {props.children}
    </p>
  );
}

function Video(props: React.PropsWithChildren<VideoProps>) {
  const [cookiesAccepted, setCookiesAccepted] = React.useState(false);

  const handleClick = () => {
    setCookiesAccepted(true);
  };

  const subline = React.Children.toArray(props.children).find((child) => {
    return React.isValidElement(child) && child.type === VideoSubline;
  });

  const { t } = useTranslation(["organisms/video"]);

  return (
    <div className="mv-w-full mv-flex mv-flex-col mv-gap-2">
      <div className="mv-w-full mv-aspect-video">
        <div className="mv-w-full mv-h-full mv-bg-primary-400 mv-flex mv-flex-col mv-justify-center mv-items-center mv-gap-4">
          {!cookiesAccepted ? (
            <>
              <Button variant="outline" onClick={handleClick}>
                {t("cookieAction")}
              </Button>
              <p className="mv-text-white mv-text-sm md:mv-text-base mv-text-center mv-px-4">
                {t("cookieActionDescription")}
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
      {typeof subline !== "undefined" && subline}
    </div>
  );
}

Video.Subline = VideoSubline;

export default Video;
