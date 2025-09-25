import { Button } from "./../molecules/Button";
import { type AboutProjectLocales } from "~/routes/project/$slug/detail/about.server";
import { useNonce } from "~/nonce-provider";
import { Children, isValidElement, useState } from "react";

type VideoProps = {
  src: string;
  locales: AboutProjectLocales;
};

function VideoSubline(props: React.PropsWithChildren) {
  return (
    <p className="text-neutral-600 text-base font-normal">{props.children}</p>
  );
}

function Video(props: React.PropsWithChildren<VideoProps>) {
  const { locales } = props;
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const nonce = useNonce();

  const handleClick = () => {
    setCookiesAccepted(true);
  };

  const subline = Children.toArray(props.children).find((child) => {
    return isValidElement(child) && child.type === VideoSubline;
  });

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="w-full aspect-video">
        <div className="w-full h-full bg-primary-400 flex flex-col justify-center items-center gap-4">
          {!cookiesAccepted ? (
            <>
              <Button variant="outline" onClick={handleClick}>
                {locales.video.cookieAction}
              </Button>
              <p className="text-white text-sm @md:text-base text-center px-4">
                {locales.video.cookieActionDescription}
              </p>
            </>
          ) : (
            <iframe
              width="100%"
              height="100%"
              src={props.src}
              title="YouTube video player"
              className="border-none rounded-sm"
              allow="fullscreen"
              allowFullScreen
              nonce={nonce}
            ></iframe>
          )}
        </div>
      </div>
      {typeof subline !== "undefined" && subline}
    </div>
  );
}

Video.Subline = VideoSubline;

export { Video };
