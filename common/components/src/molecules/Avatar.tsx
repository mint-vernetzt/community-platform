import classNames from "classnames";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export type AvatarProps = {
  name: string;
  src: string;
  size?: AvatarSize;
};

function Avatar(props: AvatarProps) {
  const { size = "md" } = props;

  const classes = classNames(
    {
      "h-[136px] w-[136px]": size === "xl",
      "h-[44px] w-[44px]": size === "lg",
      "h-[40px] w-[40px]": size === "md",
      "h-[30px] w-[30px]": size === "sm",
    },
    {
      "border-2": size === "xl",
      border: size === "lg" || size === "md" || size === "sm",
    },
    "border-gray-200 flex items-center justify-center rounded-full overflow-hidden shrink-0"
  );

  return (
    <div className={classes}>
      <img src={props.src} alt={props.name} />
    </div>
  );
}

export default Avatar;
