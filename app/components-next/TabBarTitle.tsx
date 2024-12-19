import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import React from "react";

// TODO: Integrate Counter into TabBar
export function TabBarTitle(props: { children: React.ReactNode }) {
  const children = React.Children.toArray(props.children);

  const counter = children.find((child) => {
    return (child as React.ReactElement).type === TabBar.Counter;
  });

  const otherChildren = children.filter((child) => {
    return (child as React.ReactElement).type !== TabBar.Counter;
  });

  if (counter) {
    return (
      <div className="mv-flex mv-gap-1.5 mv-items-center">
        <span>{otherChildren}</span>
        {counter}
      </div>
    );
  }

  return <>{props.children}</>;
}
