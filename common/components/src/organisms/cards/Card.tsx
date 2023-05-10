import React from "react";
import Avatar from "../../molecules/Avatar";

export type CardProps = {
  children?: React.ReactNode;
};

export function Card(props: CardProps) {
  return (
    <div className="bg-neutral-50 shadow-xl rounded-3xl relative overflow-hidden text-gray-700">
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
      {status !== undefined ? (
        <div className="bg-success-500 h-[124px] relative z-10">
          {image || null}
        </div>
      ) : (
        <div className="bg-success-500 h-40 relative z-10">{image || null}</div>
      )}
      {avatar !== undefined ? (
        <div className="flex justify-center -mt-24 relative z-20">{avatar}</div>
      ) : (
        <div className="flex justify-center -mt-24 relative z-20">
          <div className="border-gray-200 flex items-center justify-center rounded-full overflow-hidden shrink-0 h-[136px] w-[136px] text-white text-[4.375rem] bg-primary">
            WW
          </div>
        </div>
      )}
    </>
  );
}

export type CardStatusProps = {
  children?: React.ReactNode;
};

export function CardStatus(props: CardStatusProps) {
  return (
    <div className="text-center text-primary bg-primary-100 px-4 py-2 font-base leading-5 font-semibold">
      {props.children}
    </div>
  );
}

export function CardImage(props: { src: string; alt: string }) {
  return (
    <figure>
      <img
        src={props.src}
        className="absolute inset-0 w-full h-full object-cover"
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

  if (validChildren.length === 0) {
    return <div className="h-[30px]"></div>;
  }

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
