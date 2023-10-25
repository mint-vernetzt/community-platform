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
  const avatar = children.find((child) => {
    return React.isValidElement(child) && child.type === Avatar;
  });
  const controls = children.find((child) => {
    return React.isValidElement(child) && child.type === Controls;
  });
  const body = children.find((child) => {
    return React.isValidElement(child) && child.type === HeaderBody;
  });

  console.log(avatar);

  return (
    <div className="mv-relative mv-w-full mv-border mv-rounded-none md:mv-rounded-3xl mv-overflow-hidden">
      <div className="mv-relative mv-w-full mv-aspect-[3/2] md:mv-aspect-[2/1] lg:mv-aspect-[31/10] mv-bg-attention-400">
        {image || null}
        {status || null}
        {controls !== null && (
          <div className="mv-absolute mv-bottom-4 mv-right-4">{controls}</div>
        )}
        {avatar !== null && (
          <div className="mv-absolute mv-inset-x-0 mv--bottom-20 md:mv--bottom-[124px] mv-flex mv-flex-col mv-items-center">
            <div className="mv-w-40 md:mv-w-[248px] mv-aspect-[1]">
              {avatar}
            </div>
          </div>
        )}
      </div>
      <div
        className={`${
          avatar !== undefined
            ? "mv-mt-24 md:mv-mt-[140px]"
            : "mv-mt-2 md:mv-mt-4"
        }`}
      >
        {body || null}
      </div>
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
  const controls = children.find((child) => {
    return React.isValidElement(child) && child.type === Controls;
  });
  const otherChilds = children.filter((child) => {
    return React.isValidElement(child) && child.type !== Controls;
  });

  // TODO:
  // gaps between childs
  // layer avatar on top
  return (
    <div className="mv-flex mv-flex-col mv-items-center mv-w-full mv-gap-4">
      {controls || null}
      {otherChilds}
    </div>
  );
}
