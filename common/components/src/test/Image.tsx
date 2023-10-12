import React from "react";

export type ImageProps = {
  src: string;
  alt: string;
  blurredSrc: string;
  resizeType: "fit" | "fill";
};

function Image(props: ImageProps) {
  const [imageLoaded, setImageLoaded] = React.useState<boolean>(false);

  return (
    <>
      <div className="mv-absolute mv-w-full mv-h-full">
        <img
          src={props.blurredSrc}
          alt=""
          className="mv-absolute mv-w-full mv-h-full mv-object-cover"
        />
        <img
          src={props.src}
          alt={props.alt}
          onLoad={() => {
            setImageLoaded(true);
          }}
          className={`mv-absolute mv-w-full mv-h-full ${
            props.resizeType === "fit" ? "mv-object-contain" : "mv-object-cover"
          } ${
            imageLoaded
              ? "opacity-100 transition-opacity duration-200 ease-in"
              : "opacity-0 invisible"
          }`}
        />
        <noscript>
          <img
            src={props.src}
            alt={props.alt}
            className="mv-absolute mv-w-full mv-h-full"
          />
        </noscript>
      </div>
    </>
  );
}

export default Image;
