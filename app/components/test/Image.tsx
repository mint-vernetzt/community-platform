import React from "react";

export type ImageProps = {
  src: string;
  alt: string;
  blurredSrc?: string;
  resizeType?: "fit" | "fill";
};

function Image(props: ImageProps) {
  const { resizeType = "fill" } = props;
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const blurredImageRef = React.useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [blurredImageLoaded, setBlurredImageLoaded] = React.useState(false);
  React.useEffect(() => {
    if (imageRef.current !== null && imageRef.current.complete) {
      setImageLoaded(true);
    }
    if (blurredImageRef.current !== null && blurredImageRef.current.complete) {
      setBlurredImageLoaded(true);
    }
  }, []);

  return (
    <>
      <div className="mv-absolute mv-w-full mv-h-full mv-bg-positive">
        {props.blurredSrc ? (
          <img
            ref={blurredImageRef}
            src={props.blurredSrc}
            alt=""
            className={`mv-w-full mv-h-full mv-object-cover ${
              blurredImageLoaded
                ? "mv-opacity-100 mv-transition-opacity mv-duration-200 mv-ease-in"
                : "mv-opacity-0 mv-invisible"
            }`}
          />
        ) : null}
        <img
          ref={imageRef}
          src={props.src}
          alt={props.alt}
          className={`mv-absolute mv-w-full mv-h-full mv-inset-0 ${
            resizeType === "fit" ? "mv-object-contain" : "mv-object-cover"
          } ${
            imageLoaded
              ? "mv-opacity-100 mv-transition-opacity mv-duration-200 mv-ease-in"
              : "mv-opacity-0 mv-invisible"
          }`}
        />
        <noscript>
          <img
            src={props.src}
            alt={props.alt}
            className="mv-absolute mv-w-full mv-h-full mv-inset-0"
          />
        </noscript>
      </div>
    </>
  );
}

export default Image;
