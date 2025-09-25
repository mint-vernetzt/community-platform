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
    <div className="flex overflow-x-auto items-stretch">
      {validChildren.map((child, index) => {
        return (
          <div
            key={`item-${index}`}
            className="flex-none w-3/4 @sm:w-1/2 @lg:w-1/3 @xl:w-1/4 pb-8 pt-2 first:pl-4 @sm:odd:pl-4 pr-4 @lg:pl-4 "
          >
            {child}
          </div>
        );
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
