import React, { type ReactNode } from "react";
import Status from "./Status";
import Image from "./Image";
import { Avatar } from "@mint-vernetzt/components";
import Controls from "./Controls";

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
  const footer = children.find((child) => {
    return React.isValidElement(child) && child.type === HeaderFooter;
  });

  return (
    <div className="mv-relative mv-w-full mv-border mv-rounded-none md:mv-rounded-3xl mv-overflow-hidden">
      <div className="mv-relative mv-w-full mv-aspect-[3/2] md:mv-aspect-[2/1] lg:mv-aspect-[31/10] mv-bg-attention-400">
        {image || null}
        {status || null}
        {avatar !== null && (
          <div className="mv-absolute mv-inset-x-0 mv--bottom-20 md:mv--bottom-[124px] mv-flex mv-flex-col mv-items-center">
            <div className="mv-w-40 md:mv-w-[248px] mv-aspect-[1]">
              {avatar}
            </div>
          </div>
        )}
        {controls !== null && (
          <div className="mv-absolute mv-bottom-4 mv-right-4">{controls}</div>
        )}
      </div>
      {body !== undefined && (
        <div
          className={`${
            avatar !== undefined
              ? "mv-mt-24 md:mv-mt-[140px]"
              : "mv-mt-2 md:mv-mt-4"
          } mv-mb-2 md:mv-mb-4`}
        >
          {body || null}
        </div>
      )}
      {footer || null}
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
  return (
    <div className="mv-flex mv-flex-col mv-items-center mv-gap-2 mv-w-full mv-mb-6 md:mv-mb-8 mv-px-4 md:mv-px-52 mv-text-center">
      {controls !== undefined && (
        <div className="mv-my-0 md:mv-my-2">{controls}</div>
      )}
      {otherChilds}
    </div>
  );
}

type HeaderFooterProps = {
  children: ReactNode;
};

export function HeaderFooter(props: HeaderFooterProps) {
  const children = React.Children.toArray(props.children).filter((child) => {
    const isValid = React.isValidElement(child) || typeof child === "string";
    if (!isValid) {
      console.warn(
        `The child you passed to <HeaderFooter> is not a valid element and will be ignored: ${child}`
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

  return (
    <div
      className={`mv-flex mv-flex-col lg:mv-flex-row mv-gap-4 lg:mv-gap-0 mv-justify-end mv-w-full md:mv-border-t mv-p-6 ${
        otherChilds.length > 0 ? "mv-bg-accent-300" : ""
      }`}
    >
      <div className="mv-flex mv-grow mv-items-center mv-justify-center mv-font-bold">
        {otherChilds}
      </div>
      {controls !== undefined && (
        <div className="mv-flex mv-shrink mv-w-full lg:mv-w-auto mv-items-center mv-justify-center lg:mv-justify-end">
          {controls}
        </div>
      )}
    </div>
  );
}
