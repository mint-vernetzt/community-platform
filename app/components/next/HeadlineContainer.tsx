import classNames from "classnames";

// Design:
// Name: Headline Container
// TODO: No single source available anymore (Message: Component was removed from library)
// Usage https://www.figma.com/design/3VOaZGZRxO5PkehJv13mfH/Event-Detailseite?node-id=2-3517&m=dev
function HeadlineContainer(props: {
  children: React.ReactNode;
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}) {
  const { children, as } = props;

  const classes = classNames(
    "mb-0 text-neutral-700 text-xl font-bold leading-6"
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

export default HeadlineContainer;
