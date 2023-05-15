import classNames from "classnames";
import { getFullName, getInitials } from "../utils";

export type MoreIndicatorProps = {
  amount: number;
};

export function MoreIndicator(props: MoreIndicatorProps) {
  const amount = props.amount < 1000 ? `+${props.amount}` : ">999";

  const classes = classNames(
    {
      "text-sm": props.amount < 100,
      "text-xs": props.amount >= 100,
    },
    "w-[30px] h-[30px] bg-gray-200 text-gray-700 font-semibold rounded-full flex items-center justify-center"
  );
  return <div className={classes}>{amount}</div>;
}

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export type AvatarProps = { size?: AvatarSize } & (
  | {
      name: string;
      logo?: string;
    }
  | {
      firstName: string;
      lastName: string;
      avatar?: string;
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
      "h-[136px] w-[136px]": size === "xl",
      "h-[44px] w-[44px]": size === "lg",
      "h-[40px] w-[40px]": size === "md",
      "h-[30px] w-[30px]": size === "sm",
    },
    {
      "text-[70px]": size === "xl",
      "text-[22px]": size === "lg",
      "text-[20px]": size === "md",
      "text-[14px]": size === "sm",
    },
    {
      "border-2": size === "xl",
      border: size === "lg" || size === "md" || size === "sm",
    },
    "bg-primary border-gray-200 flex items-center justify-center rounded-full overflow-hidden shrink-0",
    "text-white font-normal	flex items-center justify-center"
  );

  return (
    <div className={classes}>
      {src ? <img src={src} alt={displayName} /> : <>{initials}</>}
    </div>
  );
}

export default Avatar;
