import classNames from "classnames";
import { getFullName, getInitials } from "../utils";
import {
  Image,
  type ImageProps,
} from "@mint-vernetzt/components/src/molecules/Image";
import { Children, isValidElement } from "react";
import { Link, type LinkProps } from "react-router";

function Avatar(props: AvatarProps) {
  const { size = "md", textSize = "md", as = "link" } = props;

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
      "w-full aspect-[1]": size === "full",
      "h-[136px] w-[136px]": size === "xl",
      "h-[44px] w-[44px]": size === "lg",
      "h-[40px] w-[40px]": size === "md",
      "h-[36px] w-[36px]": size === "sm",
      "h-[24px] w-[24px]": size === "xs",
      "h-[20px] w-[20px]": size === "xxs",
    },
    {
      "text-[70px]": size === "xl" || textSize === "xl",
      "text-[22px]": size === "lg" || textSize === "lg",
      "text-[20px]": size === "md" || textSize === "md",
      "text-[14px]": size === "sm" || textSize === "sm",
      "text-[10px]": size === "xs" || textSize === "xs",
      "text-[9px]": size === "xxs" || textSize === "xxs",
    },
    {
      "border-2": size === "xl" || textSize === "xl",
      border:
        size === "lg" ||
        size === "md" ||
        size === "sm" ||
        size === "xs" ||
        textSize === "lg" ||
        textSize === "md" ||
        textSize === "sm" ||
        textSize === "xs",
    },
    "bg-neutral-600 border-neutral-200 flex items-center justify-center rounded-full overflow-hidden shrink-0 text-white font-normal relative",
    props.to &&
      "hover:border-0 active:border-2 focus-within:border-2 active:border-blue-500 focus-within:border-blue-500 hover:shadow-md active:shadow-md focus-within:shadow-md"
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
        as === "link" ? (
          <Link
            to={props.to}
            target={props.target}
            rel={props.rel}
            className="w-full h-full grid grid-cols-1 grid-rows-1 place-items-center"
            prefetch={props.prefetch}
          >
            {child}
          </Link>
        ) : (
          <a
            href={props.to}
            target={props.target}
            rel={props.rel}
            className="w-full h-full grid grid-cols-1 grid-rows-1 place-items-center"
          >
            {child}
          </a>
        )
      ) : (
        <>{child}</>
      )}
    </div>
  );
}

type MoreIndicatorProps = {
  amount: number;
  to?: string;
  prefetch?: LinkProps["prefetch"];
  as?: "a" | "link";
};

function MoreIndicator(props: MoreIndicatorProps) {
  const { as = "link" } = props;
  const amount = props.amount < 1000 ? `+${props.amount}` : ">999";

  const classes = classNames(
    {
      "text-sm": props.amount < 100,
      "text-xs": props.amount >= 100,
    },
    "w-[36px] h-[36px] bg-gray-200 text-gray-700 font-semibold rounded-full flex items-center justify-center",
    props.to && "hover:shadow-md active:shadow-md focus:shadow-md"
  );
  return props.to ? (
    as === "link" ? (
      <Link to={props.to} className="rounded-full">
        <div className={classes}>{amount}</div>
      </Link>
    ) : (
      <a href={props.to} className="rounded-full">
        <div className={classes}>{amount}</div>
      </a>
    )
  ) : (
    <div className={classes}>{amount}</div>
  );
}

function wrapAvatars(children: React.ReactNode) {
  const validChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child);
  });

  if (validChildren.length === 0) {
    return <div className="h-9"></div>;
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
    <div className={classNames("flex gap-2")}>
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
  target?: string;
  rel?: string;
  altSuffix?: string;
  prefetch?: LinkProps["prefetch"];
  as?: "a" | "link";
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
