import classNames from "classnames";
import { getFullName, getInitials } from "../utils";

export type MoreIndicatorProps = {
  amount: number;
  to?: string;
};

export function MoreIndicator(props: MoreIndicatorProps) {
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
    <a href={props.to}>
      <div className={classes}>{amount}</div>
    </a>
  ) : (
    <div className={classes}>{amount}</div>
  );
}

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export type AvatarProps = { size?: AvatarSize; to?: string } & (
  | {
      name: string;
      logo?: string | null;
    }
  | {
      firstName: string;
      lastName: string;
      avatar?: string | null;
    }
);

function Avatar(props: AvatarProps) {
  const { size = "md" } = props;

  let displayName = "";
  let initials = getInitials(props);
  let src;
  if ("name" in props) {
    displayName = props.name;
    src = props.logo;
  } else if ("firstName" in props) {
    displayName = getFullName({
      firstName: props.firstName,
      lastName: props.lastName,
    });
    src = props.avatar;
  }

  const classes = classNames(
    {
      "mv-h-[136px] mv-w-[136px]": size === "xl",
      "mv-h-[44px] mv-w-[44px]": size === "lg",
      "mv-h-[40px] mv-w-[40px]": size === "md",
      "mv-h-[36px] mv-w-[36px]": size === "sm",
    },
    {
      "mv-text-[70px]": size === "xl",
      "mv-text-[22px]": size === "lg",
      "mv-text-[20px]": size === "md",
      "mv-text-[14px]": size === "sm",
    },
    {
      "mv-border-2": size === "xl",
      "mv-border": size === "lg" || size === "md" || size === "sm",
    },
    "mv-bg-primary mv-border-gray-200 mv-flex mv-items-center mv-justify-center mv-rounded-full mv-overflow-hidden mv-shrink-0",
    "mv-text-white mv-font-normal	mv-flex mv-items-center mv-justify-center",
    props.to &&
      "hover:mv-border-0 active:mv-border-0 focus:mv-border-0 hover:mv-shadow-md active:mv-shadow-md focus:mv-shadow-md"
  );

  const child = src ? <img src={src} alt={displayName} /> : <>{initials}</>;

  return (
    <div className={classes}>
      {props.to ? <a href={props.to}>{child}</a> : <>{child}</>}
    </div>
  );
}

export default Avatar;
