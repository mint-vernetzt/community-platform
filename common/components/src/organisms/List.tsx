import React from "react";
import Avatar from "../molecules/Avatar";
import classNames from "classnames";

type Size = "sm" | "md";

function List() {
  return <>List</>;
}

function ListItemTitle(props: React.PropsWithChildren<{ size?: Size }>) {
  const { size = "md" } = props;

  const classes = classNames(
    size === "sm" && "mv-text-sm",
    size === "md" && "mv-text-base",
    "mv-w-full mv-text-primary mv-font-bold mv-line-clamp-1"
  );

  return <span className={classes}>{props.children}</span>;
}

function ListItemSubtitle(props: React.PropsWithChildren<{ size?: Size }>) {
  const { size = "md" } = props;

  const classes = classNames(
    size === "sm" && "mv-font-normal",
    size === "md" && "mv-font-bold",
    "mv-text-sm mv-text-neutral-700 mv-line-clamp-1"
  );

  return <span className={classes}>{props.children}</span>;
}

function ListItemInfo(props: React.PropsWithChildren<{ size?: Size }>) {
  const { size = "md" } = props;
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

  let titleClone: React.ReactElement | undefined;
  let subtitleClone: React.ReactElement | undefined;

  if (typeof title !== "undefined") {
    titleClone = React.cloneElement(title as React.ReactElement, {
      size,
    });
  }
  if (typeof subtitle !== "undefined") {
    subtitleClone = React.cloneElement(subtitle as React.ReactElement, {
      size,
    });
  }

  return (
    <div className="mv-flex-1">
      {typeof titleClone !== "undefined" && titleClone}
      {typeof subtitleClone !== "undefined" && subtitleClone}
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

export function ListItem(
  props: React.PropsWithChildren<{
    noBorder?: boolean;
    interactive?: boolean;
    size?: Size;
  }>
) {
  const { noBorder = false, interactive = false, size = "md" } = props;

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
    size === "sm" && "mv-p-2",
    size === "md" && "mv-p-4",
    "mv-flex mv-flex-row mv-items-center mv-no-wrap mv-gap-2"
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

    let infoClone: React.ReactElement | undefined;
    if (typeof info !== "undefined") {
      infoClone = React.cloneElement(info as React.ReactElement, {
        size,
      });
    }

    const wrapperClasses = classNames(containerClasses, "mv-flex-1");

    const wrapperClone = React.cloneElement(
      wrapper as React.ReactElement,
      {
        className: wrapperClasses,
      },
      <>
        {typeof avatar !== "undefined" && avatar}
        {typeof infoClone !== "undefined" && infoClone}
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

  let infoClone: React.ReactElement | undefined;
  if (typeof info !== "undefined") {
    infoClone = React.cloneElement(info as React.ReactElement, {
      size,
    });
  }

  return (
    <li className={listItemClasses}>
      <div className={containerClasses}>
        {typeof avatar !== "undefined" && avatar}
        {typeof infoClone !== "undefined" && infoClone}
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
