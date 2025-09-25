import { useEffect, useRef, useState } from "react";

export type ImageProps = {
  src?: string;
  alt?: string;
  blurredSrc?: string;
  resizeType?: "fit" | "fill";
  disableFadeIn?: boolean;
};

function Image(props: ImageProps) {
  const { resizeType = "fill", disableFadeIn } = props;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const blurredImageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(disableFadeIn || false);
  const [blurredImageLoaded, setBlurredImageLoaded] = useState(
    disableFadeIn || false
  );
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
      <div className="relative w-full h-full bg-neutral-100">
        {props.src ? (
          <noscript className="absolute inset-0 w-full h-full">
            <img
              src={props.src}
              alt={
                typeof props.alt !== "undefined" ? `${props.alt} - (no-js)` : ""
              }
              className={`w-full h-full ${
                resizeType === "fit" ? "object-contain" : "object-cover"
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
            className={`absolute inset-0 w-full h-full object-cover ${
              blurredImageLoaded
                ? "opacity-100 transition-opacity duration-200 ease-in"
                : "opacity-0 invisible"
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
            className={`relative w-full h-full inset-0 ${
              resizeType === "fit" ? "object-contain" : "object-cover"
            } ${
              imageLoaded
                ? "opacity-100 transition-opacity duration-200 ease-in"
                : "opacity-0 invisible h-0 w-0"
            }`}
          />
        ) : null}
      </div>
    </>
  );
}

export { Image };
