import React from "react";

export type ImageProps = {
  src: string;
  alt: string;
  blurredSrc?: string;
  resizeType?: "fit" | "fill";
};

function Image(props: ImageProps) {
  const { resizeType = "fill" } = props;
  const [imageLoaded, setImageLoaded] = React.useState<boolean>(false);

  return (
    <>
      <div className="mv-absolute mv-w-full mv-h-full">
        {props.blurredSrc ? (
          <img
            src={props.blurredSrc}
            alt=""
            className="mv-w-full mv-h-full mv-object-cover"
          />
        ) : null}
        <img
          src={props.src}
          alt={props.alt}
          onLoad={() => {
            // TODO: Investigate why onLoad is not called
            setImageLoaded(true);
          }}
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
