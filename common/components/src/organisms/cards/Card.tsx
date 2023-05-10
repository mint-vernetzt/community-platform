import React from "react";
import Avatar from "../../molecules/Avatar";

export type CardProps = {
  children?: React.ReactNode;
};

export function Card(props: CardProps) {
  return (
    <div className="bg-neutral-50 shadow-xl rounded-3xl relative overflow-hidden">
      {props.children}
    </div>
  );
}

export type CardHeaderProps = {
  children?: React.ReactNode;
};

export function CardHeader(props: CardHeaderProps) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child);
    }
  );
  const status = validChildren.find((child) => {
    return (child as React.ReactElement).type === CardStatus;
  });
  const image = validChildren.find((child) => {
    return (child as React.ReactElement).type === CardImage;
  });
  const avatar = validChildren.find((child) => {
    return (child as React.ReactElement).type === Avatar;
  });
  return (
    <>
      {status || null}
      <div className="bg-green-500 h-40">{image || null}</div>
      {avatar !== undefined ? (
        <div className="flex justify-center -mt-24">{avatar}</div>
      ) : (
        <div className="mt-10"></div>
      )}
    </>
  );
}

export type CardStatusProps = {
  children?: React.ReactNode;
};

export function CardStatus(props: CardStatusProps) {
  return (
    <div className="absolute top-0 inset-x-0 text-center text-primary bg-primary-100 px-4 py-2 font-base leading-5 font-semibold">
      {props.children}
    </div>
  );
}

export function CardImage(props: { src: string; alt: string }) {
  return (
    <figure>
      <img
        src={props.src}
        className="w-full h-40 object-cover"
        alt={props.alt}
      />
    </figure>
  );
}

export type CardFooterProps = {
  children?: React.ReactNode;
};

function wrapCardFooterChildren(children: React.ReactNode) {
  const validChildren = React.Children.toArray(children).filter((child) => {
    return React.isValidElement(child);
  });
  return React.Children.map(validChildren, (child) => {
    return <div>{child}</div>;
  });
}

export function CardFooter(props: CardFooterProps) {
  return (
    <div className="p-4 pt-2">
      <hr className="h-0 border-t border-neutral-200 m-0 mb-4" />
      <div className="flex gap-2">{wrapCardFooterChildren(props.children)}</div>
    </div>
  );
}
