import { Children, isValidElement, useEffect, useRef, useState } from "react";

export type ImageProps = {
  src?: string;
  alt?: string;
  blurredSrc?: string;
  resizeType?: "fit" | "fill";
  disableFadeIn?: boolean;
};

function Image(props: React.PropsWithChildren<ImageProps>) {
  const { resizeType = "fill", disableFadeIn, children } = props;
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

  const removeButton = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === ImageRemoveButton
  );

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
        {typeof removeButton !== "undefined" ? (
          <div className="absolute top-2 right-2">{removeButton}</div>
        ) : null}
      </div>
    </>
  );
}

function ImageRemoveButton(props: {
  label: string;
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const { label, buttonProps } = props;
  return (
    <button
      aria-label={label}
      className="bg-negative-700 rounded-full"
      {...buttonProps}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M9.29202 9.29196C9.38491 9.19883 9.49526 9.12494 9.61675 9.07453C9.73824 9.02412 9.86848 8.99817 10 8.99817C10.1316 8.99817 10.2618 9.02412 10.3833 9.07453C10.5048 9.12494 10.6151 9.19883 10.708 9.29196L16 14.586L21.292 9.29196C21.385 9.19898 21.4954 9.12523 21.6168 9.07491C21.7383 9.02459 21.8685 8.99869 22 8.99869C22.1315 8.99869 22.2617 9.02459 22.3832 9.07491C22.5047 9.12523 22.615 9.19898 22.708 9.29196C22.801 9.38493 22.8747 9.49531 22.9251 9.61679C22.9754 9.73827 23.0013 9.86847 23.0013 9.99996C23.0013 10.1314 22.9754 10.2616 22.9251 10.3831C22.8747 10.5046 22.801 10.615 22.708 10.708L17.414 16L22.708 21.292C22.801 21.3849 22.8747 21.4953 22.9251 21.6168C22.9754 21.7383 23.0013 21.8685 23.0013 22C23.0013 22.1314 22.9754 22.2616 22.9251 22.3831C22.8747 22.5046 22.801 22.615 22.708 22.708C22.615 22.8009 22.5047 22.8747 22.3832 22.925C22.2617 22.9753 22.1315 23.0012 22 23.0012C21.8685 23.0012 21.7383 22.9753 21.6168 22.925C21.4954 22.8747 21.385 22.8009 21.292 22.708L16 17.414L10.708 22.708C10.615 22.8009 10.5047 22.8747 10.3832 22.925C10.2617 22.9753 10.1315 23.0012 10 23.0012C9.86853 23.0012 9.73833 22.9753 9.61685 22.925C9.49537 22.8747 9.38499 22.8009 9.29202 22.708C9.19904 22.615 9.12529 22.5046 9.07497 22.3831C9.02465 22.2616 8.99875 22.1314 8.99875 22C8.99875 21.8685 9.02465 21.7383 9.07497 21.6168C9.12529 21.4953 9.19904 21.3849 9.29202 21.292L14.586 16L9.29202 10.708C9.19889 10.6151 9.125 10.5047 9.07459 10.3832C9.02418 10.2617 8.99823 10.1315 8.99823 9.99996C8.99823 9.86842 9.02418 9.73818 9.07459 9.61669C9.125 9.4952 9.19889 9.38485 9.29202 9.29196Z"
          fill="white"
        />
      </svg>
    </button>
  );
}

Image.RemoveButton = ImageRemoveButton;

export { Image };
