import { useEffect, useRef, useState } from "react";

export type ImageProps = {
  src?: string;
  alt?: string;
  blurredSrc?: string;
  resizeType?: "fit" | "fill";
};

function Image(props: ImageProps) {
  const { resizeType = "fill" } = props;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const blurredImageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [blurredImageLoaded, setBlurredImageLoaded] = useState(false);
  useEffect(() => {
    if (imageRef.current !== null && imageRef.current.complete) {
      setImageLoaded(true);
    }
    if (blurredImageRef.current !== null && blurredImageRef.current.complete) {
      setBlurredImageLoaded(true);
    }
  }, []);

  return (
    <>
      <div className="mv-relative mv-w-full mv-h-full mv-bg-neutral-100">
        {props.src ? (
          <noscript className="mv-absolute mv-inset-0 mv-w-full mv-h-full">
            <img
              src={props.src}
              alt={
                typeof props.alt !== "undefined" ? `${props.alt} - (no-js)` : ""
              }
              className={`mv-w-full mv-h-full ${
                resizeType === "fit" ? "mv-object-contain" : "mv-object-cover"
              }`}
            />
          </noscript>
        ) : null}
        {props.blurredSrc ? (
          <img
            ref={blurredImageRef}
            src={props.blurredSrc}
            alt=""
            onLoad={() => {
              setBlurredImageLoaded(true);
            }}
            className={`mv-absolute mv-inset-0 mv-w-full mv-h-full mv-object-cover ${
              blurredImageLoaded
                ? "mv-opacity-100 mv-transition-opacity mv-duration-200 mv-ease-in"
                : "mv-opacity-0 mv-invisible"
            }`}
            aria-hidden="true"
          />
        ) : null}
        {props.src ? (
          <img
            ref={imageRef}
            src={props.src}
            alt={props.alt || ""}
            onLoad={() => {
              setImageLoaded(true);
            }}
            className={`mv-relative mv-w-full mv-h-full mv-inset-0 ${
              resizeType === "fit" ? "mv-object-contain" : "mv-object-cover"
            } ${
              imageLoaded
                ? "mv-opacity-100 mv-transition-opacity mv-duration-200 mv-ease-in"
                : "mv-opacity-0 mv-invisible mv-h-0 mv-w-0"
            }`}
          />
        ) : null}
      </div>
    </>
  );
}

export { Image };
