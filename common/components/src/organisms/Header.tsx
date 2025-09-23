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
    <div className="relative w-full border border-neutral-200 rounded-2xl overflow-hidden bg-white">
      <div className="relative w-full aspect-[3/2] @md:aspect-[2/1] @lg:aspect-[31/10] bg-attention-400">
        {image || null}
        {status !== undefined && (
          <div className="absolute top-0 inset-x-0">{status}</div>
        )}
        {avatar !== undefined && (
          <div className="absolute inset-x-0 -bottom-20 @md:-bottom-[124px] flex flex-col items-center">
            <div className="w-40 @md:w-[248px] aspect-[1]">{avatar}</div>
          </div>
        )}
        {controls !== undefined && (
          <div className="absolute bottom-4 right-4">{controls}</div>
        )}
      </div>
      {body !== undefined && (
        <div
          className={`${
            avatar !== undefined ? "mt-24 @md:mt-[140px]" : "mt-2 @md:mt-4"
          } mb-2 @md:mb-4`}
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
    <div className="flex flex-col items-center gap-2 w-full mb-6 @md:mb-8 px-4 @md:px-8 text-center">
      {controls !== undefined && (
        <div className="my-0 @md:my-2">{controls}</div>
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
      className={`flex flex-col @lg:flex-row gap-4 @lg:gap-0 justify-end w-full @md:border-t border-gray-200 p-6 ${
        otherChilds.length > 0 ? "bg-accent-300" : ""
      }`}
    >
      {otherChilds.length > 0 && (
        <div className="flex grow items-center justify-center font-bold">
          {otherChilds}
        </div>
      )}
      {controls !== undefined && (
        <div className="flex shrink w-full @lg:w-auto items-center justify-center @lg:justify-end">
          {controls}
        </div>
      )}
    </div>
  );
}

Header.Body = Body;
Header.Footer = Footer;

export { Header };
