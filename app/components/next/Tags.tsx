import classNames from "classnames";

// Design:
// Name: Tags
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10304-9521&t=MSYLIUZRT2Yu3uqY-4
function Tags(props: {
  children: React.ReactNode;
  as: "p" | "address" | "div";
}) {
  const { children, as } = props;

  const classes = classNames(
    "text-neutral-700 text-base font-normal leading-5 not-italic"
  );

  return as === "p" ? (
    <p className={classes}>{children}</p>
  ) : as === "address" ? (
    <address className={classes}>{children}</address>
  ) : (
    <div className={classes}>{children}</div>
  );
}

export default Tags;
