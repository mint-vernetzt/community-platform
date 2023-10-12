import React, { type ReactNode } from "react";
import Status from "./Status";
import Image from "./Image";

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

  return (
    <div className="mv-relative mv-w-full mv-border mv-rounded-none md:mv-rounded-3xl mv-overflow-hidden">
      <div className="mv-relative mv-w-full mv-aspect-[31/10] mv-bg-positive">
        {image || null}
        {status || null}
      </div>
      {/* TODO: Body */}
    </div>
  );
}

export default Header;
