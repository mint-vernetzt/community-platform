import classNames from "classnames";

export type StatusProps = {
  title: string;
  variant?: "primary" | "neutral" | "positive" | "negative" | "inverted";
};

function Status(props: StatusProps) {
  const { variant = "primary" } = props;

  const classes = classNames(
    "mv-absolute mv-top-0 mv-w-full mv-py-2 mv-px-4 mv-text-center mv-font-sans mv-text-base mv-not-italic mv-font-semibold mv-leading-5 mv-tracking-tight",
    variant === "primary" && "mv-text-white mv-bg-primary-300",
    variant === "neutral" && "mv-text-white mv-bg-neutral",
    variant === "positive" && "mv-text-white mv-bg-positive",
    variant === "negative" && "mv-text-white mv-bg-negative",
    variant === "inverted" && "mv-text-primary mv-bg-primary-100"
  );

  return <span className={classes}>{props.title}</span>;
}

export default Status;
