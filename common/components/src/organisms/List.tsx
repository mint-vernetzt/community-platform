import React from "react";
import Avatar from "../molecules/Avatar";
import classNames from "classnames";

function List() {
  return <>List</>;
}

function ListItemTitle(props: React.PropsWithChildren<{}>) {
  return (
    <span className="mv-w-full mv-text-primary mv-font-bold mv-line-clamp-1">
      {props.children}
    </span>
  );
}

function ListItemSubtitle(props: React.PropsWithChildren<{}>) {
  return (
    <span className="mv-text-neutral-700 mv-font-bold mv-text-sm mv-line-clamp-1">
      {props.children}
    </span>
  );
}

function ListItemInfo(props: React.PropsWithChildren<{}>) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return typeof child === "string" || React.isValidElement(child);
    }
  );

  if (validChildren.length === 1) {
    return <ListItemTitle>{validChildren[0]}</ListItemTitle>;
  }

  const title = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === ListItemTitle;
  });
  const subtitle = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === ListItemSubtitle;
  });

  return (
    <div className="mv-flex-1">
      {typeof title !== "undefined" && title}
      {typeof subtitle !== "undefined" && subtitle}
    </div>
  );
}

function ListItemControls(props: React.PropsWithChildren<{}>) {
  return (
    <div className="mv-flex mv-flex-row mv-no-wrap mv-gap-2">
      {props.children}
    </div>
  );
}

export type ListItemProps = {
  noBorder?: boolean;
  interactive?: boolean;
};

export function ListItem(props: React.PropsWithChildren<ListItemProps>) {
  const { noBorder = false, interactive = false } = props;

  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child);
    }
  );

  const controls = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === ListItemControls;
  });

  let avatar: React.ReactElement | undefined;
  let info: React.ReactElement | undefined;

  const listItemClasses = classNames(
    "mv-border mv-rounded-md mv-list-none",
    noBorder ? "mv-border-transparent" : "mv-border-neutral-200",
    interactive && "hover:mv-bg-primary-50"
  );

  const containerClasses = classNames(
    "mv-p-4 mv-flex mv-flex-row mv-items-center mv-no-wrap mv-gap-2"
  );

  if (interactive) {
    const childrenWithoutControls = validChildren.filter((child) => {
      return React.isValidElement(child) && child.type !== ListItemControls;
    });
    const wrapper = childrenWithoutControls[0];
    const wrapperChildren = React.Children.toArray(
      (wrapper as React.ReactElement).props.children
    );
    avatar = wrapperChildren.find((child) => {
      return React.isValidElement(child) && child.type === Avatar;
    }) as React.ReactElement;
    info = wrapperChildren.find((child) => {
      return React.isValidElement(child) && child.type === ListItemInfo;
    }) as React.ReactElement;

    const wrapperClasses = classNames(containerClasses, "mv-flex-1");

    const wrapperClone = React.cloneElement(
      wrapper as React.ReactElement,
      {
        className: wrapperClasses,
      },
      <>
        {typeof avatar !== "undefined" && avatar}
        {typeof info !== "undefined" && info}
      </>
    );

    return <li className={listItemClasses}>{wrapperClone}</li>;
  }

  avatar = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Avatar;
  }) as React.ReactElement;
  info = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === ListItemInfo;
  }) as React.ReactElement;

  return (
    <li className={listItemClasses}>
      <div className={containerClasses}>
        {typeof avatar !== "undefined" && avatar}
        {typeof info !== "undefined" && info}
        {typeof controls !== "undefined" && controls}
      </div>
    </li>
  );
}

ListItem.Info = ListItemInfo;
ListItem.Controls = ListItemControls;
ListItem.Title = ListItemTitle;
ListItem.Subtitle = ListItemSubtitle;

List.Item = ListItem;

export default List;
