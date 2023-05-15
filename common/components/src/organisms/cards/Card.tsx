import classNames from "classnames";
import React from "react";
import Avatar from "../../molecules/Avatar";
import { ChipContainer } from "../../molecules/Chip";

export type CardProps = {
  children?: React.ReactNode;
};

export function Card(props: CardProps) {
  return (
    <div className="w-full h-full bg-neutral-50 shadow-xl rounded-3xl relative overflow-hidden text-gray-700 flex flex-col items-stretch">
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
    <div className="bg-success-500 h-40 overflow-hidden">
      <div className="absolute w-full h-40 overflow-hidden">
        {image || null}
      </div>
      <div className="absolute w-full h-40 overflow-hidden">
        {status || null}
      </div>
      <div className="absolute w-full flex justify-center top-14">
        {avatar || null}
      </div>
    </div>
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

export function CardImage(props: { src: string }) {
  return (
    <figure>
      <img
        src={props.src}
        className="inset-0 w-full h-full object-cover"
        alt=""
      />
    </figure>
  );
}

export type CardBodyProps = {
  children?: React.ReactNode;
};

export function CardBody(props: CardBodyProps) {
  return <div className="mt-[30px] p-4">{props.children}</div>;
}

export type CardBodySectionProps = {
  title: string;
  children?: React.ReactNode;
};

export function CardBodySection(props: CardBodySectionProps) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return (
        (React.isValidElement(child) && child.type === ChipContainer) ||
        typeof child === "string"
      );
    }
  );
  const firstChild = validChildren[0];

  return (
    <div className="mb-4 last:mb-0">
      <div className="text-xs font-semibold leading-4 mb-0.5">
        {props.title}
      </div>
      {typeof firstChild === "string" && (
        <p
          className={classNames(
            "text-base font-semibold leading-4 min-h-6 truncate",
            { "text-gray-400": firstChild === "" }
          )}
        >
          {firstChild === "" ? "nicht angegeben" : firstChild}
        </p>
      )}
      {firstChild &&
        (firstChild as React.ReactElement).type === ChipContainer && (
          <div className="pt-1.5">{firstChild}</div>
        )}
    </div>
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
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child) && child.type === Avatar;
    }
  );

  return (
    <div className="p-4 pt-0 mt-auto">
      <hr className="h-0 border-t border-neutral-200 m-0 mb-4" />
      <div className="flex gap-2">
        {wrapCardFooterChildren(validChildren.slice(0, 2))}
        {validChildren.length > 2 && (
          <div className="w-[30px] h-[30px] bg-gray-200 text-gray-700 font-semibold rounded-full text-center">
            <span className="inline-block align-middle">{`+${
              validChildren.length - 2
            }`}</span>
          </div>
        )}
      </div>
    </div>
  );
}
