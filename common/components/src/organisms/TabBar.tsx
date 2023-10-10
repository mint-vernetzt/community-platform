import classNames from "classnames";
import React from "react";

export type TabBarItemProps = {
  children: React.ReactNode;
  active?: boolean;
};

export function TabBarItem(props: React.PropsWithChildren<TabBarItemProps>) {
  const { active } = props;

  const children = React.Children.toArray(props.children);
  const firstNode = children[0];

  const classes = classNames(
    "mv-min-w-fit",
    active
      ? "mv-text-primary mv-border-b-2 mv-border-b-primary"
      : "mv-text-gray-400"
  );

  // if first node is a string, wrap string into span
  if (typeof firstNode === "string") {
    return (
      <li className={classes}>
        <span className="mv-pt-6 mv-pb-1 mv-block">{firstNode}</span>
      </li>
    );
  }

  // if first node is a valid react element, get first child and wrap it into span
  if (React.isValidElement(firstNode)) {
    const clone = React.cloneElement(firstNode as React.ReactElement);
    const cloneChildren = React.Children.toArray(clone.props.children);

    if (cloneChildren.length > 0) {
      const firstChild = cloneChildren[0];
      const wrappedFirstChild = (
        <span className="mv-pt-6 mv-pb-1 mv-block">{firstChild}</span>
      );
      return (
        <li className={classes}>
          {React.cloneElement(firstNode, {}, wrappedFirstChild)}
        </li>
      );
    }
  }

  return null;
}

export type TabBarProps = {
  children: React.ReactNode;
};

function TabBar(props: TabBarProps) {
  const children = React.Children.toArray(props.children);

  const validChildren = children.filter((child) => {
    return React.isValidElement(child) && child.type === TabBarItem;
  });

  return (
    <div className="mv-overflow-x-scroll">
      <ul className="mv-mb-4 mv-flex mv-justify-between mv-flex-nowrap mv-w-fit mv-gap-4 sm:mv-gap-14 mv-font-semibold">
        {validChildren}
      </ul>
    </div>
  );
}

export default TabBar;
