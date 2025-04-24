import React from "react";
import { Button } from "./../molecules/Button";
import { type AboutProjectLocales } from "~/routes/project/$slug/detail/about.server";
import { useNonce } from "~/nonce-provider";

export type VideoProps = {
  src: string;
  locales: AboutProjectLocales;
};

function VideoSubline(props: React.PropsWithChildren) {
  return (
    <p className="mv-text-neutral-600 mv-text-base mv-font-normal">
      {props.children}
    </p>
  );
}

function Video(props: React.PropsWithChildren<VideoProps>) {
  const { locales } = props;
  const [cookiesAccepted, setCookiesAccepted] = React.useState(false);
  const nonce = useNonce();

  const handleClick = () => {
    setCookiesAccepted(true);
  };

  const subline = React.Children.toArray(props.children).find((child) => {
    return React.isValidElement(child) && child.type === VideoSubline;
  });

  return (
    <div className="mv-w-full mv-flex mv-flex-col mv-gap-2">
      <div className="mv-w-full mv-aspect-video">
        <div className="mv-w-full mv-h-full mv-bg-primary-400 mv-flex mv-flex-col mv-justify-center mv-items-center mv-gap-4">
          {!cookiesAccepted ? (
            <>
              <Button variant="outline" onClick={handleClick}>
                {locales.video.cookieAction}
              </Button>
              <p className="mv-text-white mv-text-sm @md:mv-text-base mv-text-center mv-px-4">
                {locales.video.cookieActionDescription}
              </p>
            </>
          ) : (
            <iframe
              width="100%"
              height="100%"
              src={props.src}
              title="YouTube video player"
              className="mv-border-none mv-rounded-sm"
              allow="fullscreen"
              allowFullScreen
              nonce={nonce}
              // The credentialless attribute is considered experimental and not widely supported accross all browsers.
              // It is used to prevent the browser from sending cookies and other credentials to the iframe's origin.
              // It is needed to fully levarage the COEP Header.
              // Further reading: https://developer.mozilla.org/en-US/docs/Web/Security/IFrame_credentialless
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              credentialless="true" // eslint-disable-line react/no-unknown-property
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
