import classNames from "classnames";
import { getFullName, getInitials } from "../utils";
import {
  Image,
  type ImageProps,
} from "@mint-vernetzt/components/src/molecules/Image";
import { Children, isValidElement } from "react";
import { Link } from "react-router";

function Avatar(props: AvatarProps) {
  const { size = "md", textSize = "md" } = props;

  let displayName = "";
  const initials = getInitials(props);
  let src;
  let blurredSrc;
  if ("name" in props) {
    displayName = props.name;
    src = props.logo;
    blurredSrc = props.blurredLogo;
  } else if ("firstName" in props) {
    displayName = getFullName({
      firstName: props.firstName,
      lastName: props.lastName,
    });
    src = props.avatar;
    blurredSrc = props.blurredAvatar;
  }

  const classes = classNames(
    {
      "mv-w-full mv-aspect-[1]": size === "full",
      "mv-h-[136px] mv-w-[136px]": size === "xl",
      "mv-h-[44px] mv-w-[44px]": size === "lg",
      "mv-h-[40px] mv-w-[40px]": size === "md",
      "mv-h-[36px] mv-w-[36px]": size === "sm",
      "mv-h-[24px] mv-w-[24px]": size === "xs",
      "mv-h-[20px] mv-w-[20px]": size === "xxs",
    },
    {
      "mv-text-[70px]": size === "xl" || textSize === "xl",
      "mv-text-[22px]": size === "lg" || textSize === "lg",
      "mv-text-[20px]": size === "md" || textSize === "md",
      "mv-text-[14px]": size === "sm" || textSize === "sm",
      "mv-text-[10px]": size === "xs" || textSize === "xs",
      "mv-text-[9px]": size === "xxs" || textSize === "xxs",
    },
    {
      "mv-border-2": size === "xl" || textSize === "xl",
      "mv-border":
        size === "lg" ||
        size === "md" ||
        size === "sm" ||
        size === "xs" ||
        textSize === "lg" ||
        textSize === "md" ||
        textSize === "sm" ||
        textSize === "xs",
    },
    "mv-bg-neutral-600 mv-border-neutral-200 mv-flex mv-items-center mv-justify-center mv-rounded-full mv-overflow-hidden mv-shrink-0 mv-text-white mv-font-normal mv-relative",
    props.to &&
      "hover:mv-border-0 active:mv-border-2 focus-within:mv-border-2 active:mv-border-blue-500 focus-within:mv-border-blue-500 hover:mv-shadow-md active:mv-shadow-md focus-within:mv-shadow-md"
  );
  const child = src ? (
    <Image
      alt={`${displayName}${
        typeof props.altSuffix !== "undefined" ? ` - ${props.altSuffix}` : ""
      }`}
      src={src}
      blurredSrc={blurredSrc}
      {...props}
    />
  ) : (
    <div>{initials}</div>
  );

  return (
    <div className={classes}>
      {props.to ? (
        <Link
          to={props.to}
          className="mv-w-full mv-h-full mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center"
        >
          {child}
        </Link>
      ) : (
        <>{child}</>
      )}
    </div>
  );
}

type MoreIndicatorProps = {
  amount: number;
  to?: string;
};

function MoreIndicator(props: MoreIndicatorProps) {
  const amount = props.amount < 1000 ? `+${props.amount}` : ">999";

  const classes = classNames(
    {
      "mv-text-sm": props.amount < 100,
      "mv-text-xs": props.amount >= 100,
    },
    "mv-w-[36px] mv-h-[36px] mv-bg-gray-200 mv-text-gray-700 mv-font-semibold mv-rounded-full mv-flex mv-items-center mv-justify-center",
    props.to && "hover:mv-shadow-md active:mv-shadow-md focus:mv-shadow-md"
  );
  return props.to ? (
    <Link to={props.to} className="mv-rounded-full">
      <div className={classes}>{amount}</div>
    </Link>
  ) : (
    <div className={classes}>{amount}</div>
  );
}

function wrapAvatars(children: React.ReactNode) {
  const validChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child);
  });

  if (validChildren.length === 0) {
    return <div className="mv-h-9"></div>;
  }

  return Children.map(validChildren, (child) => {
    return <div>{child}</div>;
  });
}

type AvatarListProps = {
  visibleAvatars?: number;
  children?: React.ReactNode;
  moreIndicatorProps?: Partial<MoreIndicatorProps>;
};

export function AvatarList(props: AvatarListProps) {
  const avatars = Children.toArray(props.children).filter((child) => {
    return isValidElement(child) && child.type === Avatar;
  });

  return (
    <div className={classNames("mv-flex mv-gap-2")}>
      {props.visibleAvatars !== undefined ? (
        <>
          {wrapAvatars(avatars.slice(0, props.visibleAvatars))}
          {avatars.length > props.visibleAvatars && (
            <MoreIndicator
              {...props.moreIndicatorProps}
              amount={avatars.length - props.visibleAvatars}
            />
          )}
        </>
      ) : (
        wrapAvatars(avatars.slice(0, props.visibleAvatars))
      )}
    </div>
  );
}

type AvatarSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "full";

type TextSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl";

type AvatarProps = {
  size?: AvatarSize;
  textSize?: TextSize;
  to?: string;
  altSuffix?: string;
} & (
  | {
      name: string;
      logo?: string | null;
      blurredLogo?: string;
    }
  | ({
      firstName: string;
      lastName: string;
      avatar?: string | null;
      blurredAvatar?: string;
    } & ImageProps)
);

Avatar.List = AvatarList;

export { Avatar };
