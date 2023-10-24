import React, { type ReactNode } from "react";
import Status from "./Status";
import Image from "./Image";
import Controls from "./Controls";

type HeaderProps = {
  children: ReactNode;
};

function Header(props: HeaderProps) {
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

  return (
    <div className="mv-relative mv-w-full mv-border mv-rounded-none md:mv-rounded-3xl mv-overflow-hidden">
      <div className="mv-relative mv-w-full mv-aspect-[3/2] md:mv-aspect-[2/1] lg:mv-aspect-[31/10] mv-bg-positive">
        {image || null}
        {status || null}
        {controls !== null && (
          <div className="mv-absolute mv-bottom-4 mv-right-4">{controls}</div>
        )}
      </div>
      {/* TODO: Body */}
    </div>
  );
}

export default Header;
