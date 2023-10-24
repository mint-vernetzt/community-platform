import React, { type ReactNode } from "react";
import Status from "./Status";
import Image from "./Image";
import Controls from "./Controls";
import { Avatar } from "@mint-vernetzt/components";

type HeaderProps = {
  children: ReactNode;
};

export function Header(props: HeaderProps) {
  const children = React.Children.toArray(props.children);
  const status = children.find((child) => {
    return React.isValidElement(child) && child.type === Status;
  });
  const image = children.find((child) => {
    return React.isValidElement(child) && child.type === Image;
  });
  const controls = children.find((child) => {
    return React.isValidElement(child) && child.type === Controls;
  });
  const body = children.find((child) => {
    return React.isValidElement(child) && child.type === HeaderBody;
  });

  return (
    <div className="mv-relative mv-w-full mv-border mv-rounded-none md:mv-rounded-3xl mv-overflow-hidden">
      <div className="mv-relative mv-w-full mv-aspect-[3/2] md:mv-aspect-[2/1] lg:mv-aspect-[31/10] mv-bg-attention-400">
        {image || null}
        {status || null}
        {controls !== null && (
          <div className="mv-absolute mv-bottom-4 mv-right-4">{controls}</div>
        )}
      </div>
      {body || null}
    </div>
  );
}

type HeaderBodyProps = {
  children: ReactNode;
};

export function HeaderBody(props: HeaderBodyProps) {
  const children = React.Children.toArray(props.children).filter((child) => {
    const isValid = React.isValidElement(child);
    if (!isValid) {
      console.warn(
        `The child you passed to <HeaderBody> is not a valid element and will be ignored: ${child}`
      );
    }
    return isValid;
  });
  const avatar = children.find((child) => {
    return React.isValidElement(child) && child.type === Avatar;
  });
  const controls = children.find((child) => {
    return React.isValidElement(child) && child.type === Controls;
  });
  const otherChilds = children.filter((child) => {
    return (
      React.isValidElement(child) &&
      child.type !== Avatar &&
      child.type !== Controls
    );
  });

  // TODO:
  // gaps between childs
  // layer avatar on top
  return (
    <div className="mv-flex mv-flex-col mv-items-center mv-w-full">
      {avatar !== null && (
        <div className="mv-w-40 md:mv-w-[248px] mv-aspect-[1] mv--mt-20 md:mv--mt-[124px]">
          {avatar}
        </div>
      )}
      {controls || null}
      {otherChilds}
    </div>
  );
}
