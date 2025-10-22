import classNames from "classnames";
import { Avatar } from "../../molecules/Avatar";
import { ChipContainer } from "../../molecules/Chip";
import { Image } from "../../molecules/Image";
import { Children, isValidElement } from "react";
import { Link, type LinkProps } from "react-router";

type CardProps = {
  children?: React.ReactNode;
  to?: string;
  prefetch?: LinkProps["prefetch"];
};

function Card(props: CardProps) {
  const children = Children.toArray(props.children);

  const header = children.find((child) => {
    return isValidElement(child) && child.type === CardHeader;
  });

  const body = children.find((child) => {
    return isValidElement(child) && child.type === CardBody;
  });

  const footer = children.find((child) => {
    return isValidElement(child) && child.type === CardFooter;
  });

  const controls = children.find((child) => {
    return isValidElement(child) && child.type === CardControls;
  });

  return (
    <div className="w-full h-full bg-white border focus-within:ring-2 border-neutral-200 focus-within:ring-primary-200 rounded-lg relative overflow-hidden text-gray-700 flex flex-col min-w-[304px]">
      {props.to !== undefined && props.to !== "" ? (
        <>
          <div className="h-full hover:bg-neutral-100 active:bg-neutral-100 focus:bg-neutral-100">
            <Link
              to={props.to}
              className="focus:outline-hidden"
              prefetch={props.prefetch}
            >
              {header || null}
              {body || null}
            </Link>
          </div>
          {footer || null}
        </>
      ) : (
        <>
          {header || null}
          {body || null}
          {footer || null}
        </>
      )}
      {controls || null}
    </div>
  );
}

export type CardHeaderProps = {
  children?: React.ReactNode;
  // TODO: We do pass in here the context. The header should handle different appearances without knowing the card/application context.
  cardType?: "profile" | "organization" | "event" | "project";
};

export function CardHeader(props: CardHeaderProps) {
  const validChildren = Children.toArray(props.children).filter((child) => {
    return isValidElement(child);
  });
  const status = validChildren.find((child) => {
    return (child as React.ReactElement).type === CardStatus;
  });
  const image = validChildren.find((child) => {
    return (child as React.ReactElement).type === Image;
  });
  const avatar = validChildren.find((child) => {
    return (child as React.ReactElement).type === Avatar;
  });

  const info = validChildren.find((child) => {
    return isValidElement(child) && child.type === CardInfo;
  });

  const infoOverlay = validChildren.find((child) => {
    return isValidElement(child) && child.type === CardInfoOverlay;
  });

  const dimension = props.cardType === "event" ? "aspect-[3/2]" : "h-40";

  const containerClasses = classNames(
    "w-full overflow-hidden",
    dimension,
    props.cardType === "project" ? "bg-attention" : "bg-positive"
  );

  const overlayClasses = classNames(
    "absolute w-full overflow-hidden",
    dimension
  );

  return (
    <>
      <div className={containerClasses}>
        {image !== undefined && (
          <div
            className={`absolute w-full overflow-hidden ${
              props.cardType === "event" ? "aspect-[3/2]" : "h-40"
            }`}
          >
            {image}
          </div>
        )}
        {status !== undefined && <div className={overlayClasses}>{status}</div>}
        {avatar !== undefined && (
          <div className="absolute w-full flex justify-center top-14">
            {avatar}
          </div>
        )}

        {infoOverlay !== undefined && (
          <div className={overlayClasses}>{infoOverlay}</div>
        )}
      </div>
      {info !== undefined && info}
    </>
  );
}

Card.Header = CardHeader;

type CardInfoOverlayProps = {
  children?: React.ReactNode;
};

export function CardInfoOverlay(props: CardInfoOverlayProps) {
  return (
    <div className="w-full h-full flex justify-between items-end align-bottom flex-nowrap top-28 px-3 py-4">
      {props.children}
    </div>
  );
}

Card.InfoOverlay = CardInfoOverlay;

type CardInfoProps = {
  children?: React.ReactNode;
};

export function CardInfo(props: CardInfoProps) {
  return (
    <div className="w-full flex justify-between flex-nowrap gap-1 px-4 pt-3">
      {props.children}
    </div>
  );
}

Card.Info = CardInfo;

type CardStatusProps = {
  children?: React.ReactNode;
  variant?: "primary" | "neutral" | "positive" | "negative";
  inverted?: boolean;
};

export function CardStatus(props: CardStatusProps) {
  const { variant = "primary", inverted = false } = props;
  const classes = classNames(
    "text-center px-4 py-3 font-base leading-5 font-semibold",
    variant === "primary" && !inverted && "text-primary bg-primary-100",
    variant === "primary" && inverted && "text-white bg-primary-300",
    variant === "neutral" && "text-white bg-neutral",
    variant === "positive" && "text-white bg-positive",
    variant === "negative" && "text-white bg-negative"
  );

  return <div className={classes}>{props.children}</div>;
}

Card.Status = CardStatus;

function CardImage(props: {
  src: string;
  blurSrc?: string;
  isHydrated?: boolean;
  cardType?: "profile" | "organization" | "event" | "project";
}) {
  return (
    <>
      {props.cardType === "event" ? (
        <div className="w-full h-full absolute">
          {props.blurSrc ? (
            <img
              src={props.blurSrc}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
          ) : null}
          <img
            src={props.src}
            className={`w-full h-full object-cover absolute inset-0
                  ${
                    props.isHydrated === undefined
                      ? ""
                      : props.isHydrated
                        ? "opacity-100 transition-opacity duration-200 ease-in"
                        : "opacity-0 invisible"
                  }
                  `}
            // TODO: alt text for user generated images
            alt=""
            aria-hidden="true"
          />
          {props.isHydrated !== undefined && (
            <noscript>
              <img
                src={props.src}
                className={`w-full h-full object-cover absolute inset-0`}
                // TODO: alt text for user generated images
                alt=""
                aria-hidden="true"
              />
            </noscript>
          )}
        </div>
      ) : (
        <img
          src={props.src}
          className="inset-0 w-full h-full object-cover"
          // TODO: alt text for user generated images
          alt=""
          aria-hidden="true"
        />
      )}
    </>
  );
}

Card.Image = CardImage;

type CardBodyProps = {
  children?: React.ReactNode;
};

export function CardBody(props: CardBodyProps) {
  return <div className="p-4">{props.children}</div>;
}

type CardBodySectionProps = {
  title: string;
  emptyMessage?: string;
  children?: React.ReactNode;
};

export function CardBodySection(props: CardBodySectionProps) {
  const { emptyMessage = "-nicht angegeben-" } = props;

  const validChildren = Children.toArray(props.children).filter((child) => {
    return (
      (isValidElement(child) && child.type === ChipContainer) ||
      typeof child === "string"
    );
  });
  const firstChild = validChildren[0];

  return (
    <div className="mb-4 last:mb-0 text-neutral-700">
      <div className="text-xs font-semibold leading-4 mb-0.5">
        {props.title}
      </div>
      {typeof firstChild === "string" && (
        <p
          className={classNames(
            "min-h-6 truncate",
            firstChild === ""
              ? "text-sm font-normal text-neutral-700 leading-5 tracking-[2%]"
              : "text-base font-semibold leading-4"
          )}
        >
          {firstChild === "" ? emptyMessage : firstChild}
        </p>
      )}
      {firstChild &&
        (firstChild as React.ReactElement).type === ChipContainer && (
          <div className="pt-1.5">{firstChild}</div>
        )}
    </div>
  );
}

Card.Body = CardBody;

type CardFooterProps = {
  children?: React.ReactNode;
};

export function CardFooter(props: CardFooterProps) {
  return (
    <div className="p-4 pt-0 mt-auto">
      <hr className="h-0 border-t border-neutral-200 m-0 mb-4" />
      <div className="flex justify-between items-center">{props.children}</div>
    </div>
  );
}

Card.Footer = CardFooter;

export function CardControls(props: React.PropsWithChildren) {
  const { children } = props;

  return <div className="absolute top-4 right-4">{children}</div>;
}

Card.Controls = CardControls;

export { Card };
