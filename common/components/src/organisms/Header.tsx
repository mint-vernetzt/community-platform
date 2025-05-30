import { Controls } from "./../organisms/containers/Controls";
import { Avatar } from "./../molecules/Avatar";
import { Image } from "./../molecules/Image";
import { Status } from "./../molecules/Status";
import { Children, isValidElement } from "react";

type HeaderProps = {
  children: React.ReactNode;
};

function Header(props: HeaderProps) {
  const children = Children.toArray(props.children);
  const status = children.find((child) => {
    return isValidElement(child) && child.type === Status;
  });
  const image = children.find((child) => {
    return isValidElement(child) && child.type === Image;
  });
  const avatar = children.find((child) => {
    return isValidElement(child) && child.type === Avatar;
  });
  const controls = children.find((child) => {
    return isValidElement(child) && child.type === Controls;
  });
  const body = children.find((child) => {
    return isValidElement(child) && child.type === Body;
  });
  const footer = children.find((child) => {
    return isValidElement(child) && child.type === Footer;
  });

  if (body === undefined && avatar !== undefined) {
    console.warn(
      "You are using the <Avatar> component without the <Header.Body> component. This will lead to hidden overflow of the <Avatar>. Please add a <Header.Body>."
    );
  }

  return (
    <div className="mv-relative mv-w-full mv-border mv-border-neutral-200 mv-rounded-2xl mv-overflow-hidden mv-bg-white">
      <div className="mv-relative mv-w-full mv-aspect-[3/2] @md:mv-aspect-[2/1] @lg:mv-aspect-[31/10] mv-bg-attention-400">
        {image || null}
        {status !== undefined && (
          <div className="mv-absolute mv-top-0 mv-inset-x-0">{status}</div>
        )}
        {avatar !== undefined && (
          <div className="mv-absolute mv-inset-x-0 -mv-bottom-20 @md:-mv-bottom-[124px] mv-flex mv-flex-col mv-items-center">
            <div className="mv-w-40 @md:mv-w-[248px] mv-aspect-[1]">
              {avatar}
            </div>
          </div>
        )}
        {controls !== undefined && (
          <div className="mv-absolute mv-bottom-4 mv-right-4">{controls}</div>
        )}
      </div>
      {body !== undefined && (
        <div
          className={`${
            avatar !== undefined
              ? "mv-mt-24 @md:mv-mt-[140px]"
              : "mv-mt-2 @md:mv-mt-4"
          } mv-mb-2 @md:mv-mb-4`}
        >
          {body}
        </div>
      )}
      {footer || null}
    </div>
  );
}

type BodyProps = {
  children: React.ReactNode;
};

function Body(props: BodyProps) {
  const children = Children.toArray(props.children).filter((child) => {
    const isValid = isValidElement(child);
    if (!isValid) {
      console.warn(
        `The child you passed to <HeaderBody> is not a valid element and will be ignored: ${child}`
      );
    }
    return isValid;
  });
  const controls = children.find((child) => {
    return isValidElement(child) && child.type === Controls;
  });
  const otherChilds = children.filter((child) => {
    return isValidElement(child) && child.type !== Controls;
  });

  return (
    <div className="mv-flex mv-flex-col mv-items-center mv-gap-2 mv-w-full mv-mb-6 @md:mv-mb-8 mv-px-4 @md:mv-px-8 mv-text-center">
      {controls !== undefined && (
        <div className="mv-my-0 @md:mv-my-2">{controls}</div>
      )}
      {otherChilds}
    </div>
  );
}

type FooterProps = {
  children: React.ReactNode;
};

function Footer(props: FooterProps) {
  const children = Children.toArray(props.children).filter((child) => {
    const isValid = isValidElement(child) || typeof child === "string";
    if (!isValid) {
      console.warn(
        `The child you passed to <HeaderFooter> is not a valid element and will be ignored: ${child}`
      );
    }
    return isValid;
  });
  const controls = children.find((child) => {
    return isValidElement(child) && child.type === Controls;
  });
  const otherChilds = children.filter((child) => {
    return isValidElement(child) && child.type !== Controls;
  });

  return (
    <div
      className={`mv-flex mv-flex-col @lg:mv-flex-row mv-gap-4 @lg:mv-gap-0 mv-justify-end mv-w-full @md:mv-border-t mv-p-6 ${
        otherChilds.length > 0 ? "mv-bg-accent-300" : ""
      }`}
    >
      {otherChilds.length > 0 && (
        <div className="mv-flex mv-grow mv-items-center mv-justify-center mv-font-bold">
          {otherChilds}
        </div>
      )}
      {controls !== undefined && (
        <div className="mv-flex mv-shrink mv-w-full @lg:mv-w-auto mv-items-center mv-justify-center @lg:mv-justify-end">
          {controls}
        </div>
      )}
    </div>
  );
}

Header.Body = Body;
Header.Footer = Footer;

export { Header };
