import classNames from "classnames";
import React from "react";
import type { MoreIndicatorProps } from "../../molecules/Avatar";
import Avatar, { MoreIndicator } from "../../molecules/Avatar";
import { ChipContainer } from "../../molecules/Chip";

export type CardProps = {
  children?: React.ReactNode;
  to?: string;
};

export function Card(props: CardProps) {
  const children = React.Children.toArray(props.children);

  const header = children.find((child) => {
    return React.isValidElement(child) && child.type === CardHeader;
  });

  const body = children.find((child) => {
    return React.isValidElement(child) && child.type === CardBody;
  });

  const footer = children.find((child) => {
    return React.isValidElement(child) && child.type === CardFooter;
  });

  return (
    <div className="mv-w-full mv-h-full mv-bg-neutral-50 mv-shadow-xl mv-rounded-3xl mv-relative mv-overflow-hidden mv-text-gray-700 mv-flex mv-flex-col mv-items-stretch">
      {props.to !== undefined && props.to !== "" ? (
        <>
          <div className="mv-h-full hover:mv-bg-neutral-100 active:mv-bg-neutral-100 focus:mv-bg-neutral-100">
            <a href={props.to}>
              {header || null}
              {body || null}
            </a>
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

  const info = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === CardInfo;
  });

  const infoOverlay = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === CardInfoOverlay;
  });

  return (
    <>
      <div className="mv-bg-positive mv-h-40 mv-overflow-hidden">
        {image !== undefined && (
          <div className="mv-absolute mv-w-full mv-h-40 mv-overflow-hidden">
            {image}
          </div>
        )}
        {status !== undefined && (
          <div className="mv-absolute mv-w-full mv-h-40 mv-overflow-hidden">
            {status}
          </div>
        )}
        {avatar !== undefined && (
          <div className="mv-absolute mv-w-full mv-flex mv-justify-center mv-top-14">
            {avatar}
          </div>
        )}

        {infoOverlay !== undefined && (
          <div className="mv-absolute mv-w-full mv-h-40 mv-overflow-hidden">
            {infoOverlay}
          </div>
        )}
      </div>
      {info !== undefined && info}
    </>
  );
}

export type CardInfoOverlayProps = {
  children?: React.ReactNode;
};

export function CardInfoOverlay(props: CardInfoOverlayProps) {
  return (
    <div className="mv-w-full mv-h-full mv-flex mv-justify-between mv-items-end mv-align-bottom mv-flex-nowrap mv-top-28 mv-px-3 mv-py-4">
      {props.children}
    </div>
  );
}

export type CardInfoProps = {
  children?: React.ReactNode;
};

export function CardInfo(props: CardInfoProps) {
  return (
    <div className="mv-w-full mv-flex mv-justify-between mv-flex-nowrap mv-px-4 mv-pt-3">
      {props.children}
    </div>
  );
}

export type CardStatusProps = {
  children?: React.ReactNode;
  variant?: "primary" | "neutral" | "positive" | "negative";
  inverted?: boolean;
};

export function CardStatus(props: CardStatusProps) {
  const { variant = "primary", inverted = false } = props;
  const classes = classNames(
    "mv-text-center mv-px-4 mv-py-2 mv-font-base mv-leading-5 mv-font-semibold",
    variant === "primary" && !inverted && "mv-text-primary mv-bg-primary-100",
    variant === "primary" && inverted && "mv-text-white mv-bg-primary-300",
    variant === "neutral" && "mv-text-white mv-bg-neutral",
    variant === "positive" && "mv-text-white mv-bg-positive",
    variant === "negative" && "mv-text-white mv-bg-negative"
  );

  return <div className={classes}>{props.children}</div>;
}

export function CardImage(props: { src: string }) {
  return (
    <img
      src={props.src}
      className="mv-inset-0 mv-w-full mv-h-full mv-object-cover"
      alt=""
    />
  );
}

export type CardBodyProps = {
  children?: React.ReactNode;
};

export function CardBody(props: CardBodyProps) {
  return <div className="mv-p-4">{props.children}</div>;
}

export type CardBodySectionProps = {
  title: string;
  emptyMessage?: string;
  children?: React.ReactNode;
};

export function CardBodySection(props: CardBodySectionProps) {
  const { emptyMessage = "-nicht angegeben-" } = props;

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
    <div className="mv-mb-4 last:mv-mb-0 mv-text-neutral-700">
      <div className="mv-text-xs mv-font-semibold mv-leading-4 mv-mb-0.5">
        {props.title}
      </div>
      {typeof firstChild === "string" && (
        <p
          className={classNames(
            "mv-font-semibold mv-leading-4 mv-min-h-6 mv-truncate",
            firstChild === ""
              ? "mv-text-sm mv-text-neutral-400"
              : "mv-text-base"
          )}
        >
          {firstChild === "" ? emptyMessage : firstChild}
        </p>
      )}
      {firstChild &&
        (firstChild as React.ReactElement).type === ChipContainer && (
          <div className="mv-pt-1.5">{firstChild}</div>
        )}
    </div>
  );
}

export type CardFooterProps = {
  children?: React.ReactNode;
  alignment?: "left" | "center";
  numberOfAvatars?: number;
  moreIndicatorProps?: Partial<MoreIndicatorProps>;
};

function wrapCardFooterChildren(children: React.ReactNode) {
  const validChildren = React.Children.toArray(children).filter((child) => {
    return React.isValidElement(child);
  });

  if (validChildren.length === 0) {
    return <div className="mv-h-[36px]"></div>;
  }

  return React.Children.map(validChildren, (child) => {
    return <div>{child}</div>;
  });
}

export function CardFooter(props: CardFooterProps) {
  const { numberOfAvatars = 2 } = props;

  const avatars = React.Children.toArray(props.children).filter((child) => {
    return React.isValidElement(child) && child.type === Avatar;
  });

  return (
    <div className="mv-p-4 mv-pt-0 mv-mt-auto">
      <hr className="mv-h-0 mv-border-t mv-border-neutral-200 mv-m-0 mv-mb-4" />
      <div
        className={classNames(
          "mv-flex mv-gap-2",
          props.alignment === "center" && "mv-justify-center"
        )}
      >
        {wrapCardFooterChildren(avatars.slice(0, numberOfAvatars))}
        {avatars.length > numberOfAvatars && (
          <MoreIndicator
            {...props.moreIndicatorProps}
            amount={avatars.length - numberOfAvatars}
          />
        )}
      </div>
    </div>
  );
}

export type CardRowContainerProps = {
  children?: React.ReactNode;
};

function wrapCardRowContainerChildren(
  children: React.ReactNode,
  itemsPerRow: number
) {
  const validChildren = React.Children.toArray(children).filter((child) => {
    return React.isValidElement(child);
  });

  return React.Children.map(validChildren, (child) => {
    return (
      <div className="mv-w-3/4 md:mv-w-1/3 mv-px-2 md:mv-px-4 mv-shrink-0">
        {child}
      </div>
    );
  });
}

export function CardRowContainer(props: CardRowContainerProps) {
  const itemsPerRow = 3;

  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child);
    }
  );

  const classes = classNames("mv-flex mv--mx-2 md:mv--mx-4 mv-mb-8", {
    "mv-flex-wrap": itemsPerRow < validChildren.length,
  });

  return (
    <div className="mv-relative">
      <div className={classes}>
        {wrapCardRowContainerChildren(validChildren, itemsPerRow)}
      </div>
    </div>
  );
}
