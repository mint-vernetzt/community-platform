import React from "react";
import Avatar from "../molecules/Avatar";

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
};

export function ListItem(props: React.PropsWithChildren<{}>) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child);
    }
  );

  const avatar = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Avatar;
  });
  const info = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === ListItemInfo;
  });
  const controls = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === ListItemControls;
  });

  return (
    <li className="mv-flex mv-flex-row mv-items-center mv-no-wrap mv-p-4 mv-gap-2 mv-border mv-rounded">
      {typeof avatar !== "undefined" && avatar}
      {typeof info !== "undefined" && info}
      {typeof controls !== "undefined" && controls}
    </li>
  );
}

ListItem.Info = ListItemInfo;
ListItem.Controls = ListItemControls;
ListItem.Title = ListItemTitle;
ListItem.Subtitle = ListItemSubtitle;

List.Item = ListItem;

export default List;
