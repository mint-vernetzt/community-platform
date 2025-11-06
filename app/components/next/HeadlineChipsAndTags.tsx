import classNames from "classnames";

// Design:
// Name: Headline_Chips & Tags
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=11961-9132&t=28CROvSUjmSDy5sE-4
function HeadlineChipsAndTags(props: {
  children: React.ReactNode;
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}) {
  const { children, as } = props;

  const classes = classNames(
    "mb-0 text-neutral-600 text-xs font-semibold leading-5"
  );

  return as === "h1" ? (
    <h1 className={classes}>{children}</h1>
  ) : as === "h2" ? (
    <h2 className={classes}>{children}</h2>
  ) : as === "h3" ? (
    <h3 className={classes}>{children}</h3>
  ) : as === "h4" ? (
    <h4 className={classes}>{children}</h4>
  ) : as === "h5" ? (
    <h5 className={classes}>{children}</h5>
  ) : (
    <h6 className={classes}>{children}</h6>
  );
}

export default HeadlineChipsAndTags;
