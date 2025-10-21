import classNames from "classnames";
import { Children, isValidElement } from "react";

type CardContainerType = "single row" | "multi row";
type CardContainerProps = {
  type?: CardContainerType;
} & React.HTMLAttributes<HTMLDivElement>;

function CardContainer(props: CardContainerProps) {
  const { type = "single row" } = props;
  const validChildren = Children.toArray(props.children).filter((child) => {
    return isValidElement(child);
  });

  return type === "single row" ? (
    <div className="flex overflow-x-auto gap-8">
      {validChildren.map((child) => {
        return child;
      })}
    </div>
  ) : (
    <div className={`flex flex-wrap`}>
      {validChildren.map((child, index) => {
        const classes = classNames(
          "w-full @sm:w-1/2 @lg:w-1/3 @xl:w-1/4 pb-8 px-4"
        );

        return (
          <div key={`item-${index}`} className={classes}>
            {child}
          </div>
        );
      })}
    </div>
  );
}

export { CardContainer };
