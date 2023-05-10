import React from "react";

export type CardFooterProps = {
  children?: React.ReactNode;
};

function wrapCardFooterChildren(children: React.ReactNode) {
  const validChildren = React.Children.toArray(children).filter((child) => {
    return React.isValidElement(child);
  });
  return React.Children.map(validChildren, (child) => {
    return <div>{child}</div>;
  });
}

export function CardFooter(props: CardFooterProps) {
  return (
    <div className="p-4 pt-2">
      <hr className="h-0 border-t border-neutral-200 m-0 mb-4" />
      <div className="flex gap-2">{wrapCardFooterChildren(props.children)}</div>
    </div>
  );
}
