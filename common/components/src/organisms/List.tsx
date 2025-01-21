import React from "react";
import { Avatar } from "../molecules/Avatar";
import classNames from "classnames";
import { type ImageProps } from "./../molecules/Image";
import { Link, type LinkProps } from "@remix-run/react";

type Size = "sm" | "md";

type ListItemPreviewProps = ImageProps;

function PDFIcon(props: { classNames?: string }) {
  return (
    <svg
      {...props}
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M31.5 10.126V31.501C31.5 33.9863 29.4853 36.001 27 36.001H24.75V33.751H27C28.2426 33.751 29.25 32.7436 29.25 31.501V10.126H24.75C22.886 10.126 21.375 8.61494 21.375 6.75098V2.25098H9C7.75736 2.25098 6.75 3.25834 6.75 4.50098V24.751H4.5V4.50098C4.5 2.01569 6.51472 0.000976562 9 0.000976562H21.375L31.5 10.126ZM3.59912 26.6634H0V35.6612H1.77979V32.6422H3.58594C4.23193 32.6422 4.78125 32.5125 5.23389 32.2533C5.69092 31.9896 6.03809 31.6336 6.27539 31.1854C6.51709 30.7328 6.63794 30.2252 6.63794 29.6627C6.63794 29.1002 6.51929 28.5926 6.28198 28.14C6.04468 27.6873 5.69971 27.3292 5.24707 27.0655C4.79883 26.7975 4.24951 26.6634 3.59912 26.6634ZM4.8252 29.6627C4.8252 29.9967 4.76147 30.2823 4.63403 30.5196C4.51099 30.7525 4.33301 30.9327 4.1001 31.0602C3.86719 31.1832 3.58594 31.2447 3.25635 31.2447H1.77319V28.0807H3.25635C3.74854 28.0807 4.13306 28.2169 4.40991 28.4893C4.68677 28.7618 4.8252 29.1529 4.8252 29.6627ZM7.56475 26.6634V35.6612H10.8475C11.7527 35.6612 12.502 35.4832 13.0953 35.1273C13.6929 34.7713 14.139 34.255 14.4334 33.5782C14.7278 32.9015 14.875 32.0885 14.875 31.1393C14.875 30.1944 14.7278 29.388 14.4334 28.7201C14.1434 28.0521 13.7017 27.5423 13.1084 27.1908C12.5152 26.8392 11.7615 26.6634 10.8475 26.6634H7.56475ZM9.34453 28.1136H10.6102C11.1683 28.1136 11.6253 28.2279 11.9812 28.4564C12.3416 28.6849 12.6075 29.0255 12.7789 29.4781C12.9546 29.9308 13.0425 30.4955 13.0425 31.1722C13.0425 31.682 12.992 32.1258 12.8909 32.5038C12.7942 32.8817 12.647 33.1981 12.4493 33.453C12.2559 33.7035 12.0054 33.8924 11.6978 34.0199C11.3902 34.1429 11.0276 34.2044 10.6102 34.2044H9.34453V28.1136ZM17.7662 32.0819V35.6612H15.9864V26.6634H21.7213V28.1334H17.7662V30.6449H21.3785V32.0819H17.7662Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ListItemPreview(props: ListItemPreviewProps) {
  let type = "pdf";
  if (typeof props.src !== "undefined") {
    type = "image";
  }

  return (
    <div className="mv-bg-primary-100 mv-w-full mv-h-full">
      {type === "pdf" && (
        <div className="mv-flex mv-justify-center mv-items-center  mv-text-primary-400 mv-h-full">
          <PDFIcon />
        </div>
      )}
    </div>
  );
}

function List(props: React.PropsWithChildren<{ maxColumns?: number }>) {
  const { maxColumns: columns = 1 } = props;

  const listClasses = classNames(
    "mv-grid mv-grid-cols-1 mv-gap-2",
    columns === 2 && "@lg:mv-grid-cols-2 @lg:mv-gap-4"
  );

  return <ul className={listClasses}>{props.children}</ul>;
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
      // @ts-ignore - We should look at our cloneElement implementation.
      size,
    });
  }
  if (typeof subtitle !== "undefined") {
    subtitleClone = React.cloneElement(subtitle as React.ReactElement, {
      // @ts-ignore - We should look at our cloneElement implementation.
      size,
    });
  }

  return typeof titleClone === "undefined" &&
    typeof subtitleClone === "undefined" ? null : (
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
    as?: {
      type: "link";
      props: LinkProps;
    };
  }>
) {
  const { noBorder = false, interactive = false, size = "md", as } = props;

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
    "mv-border mv-rounded-md mv-list-none mv-overflow-hidden",
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
    avatar = childrenWithoutControls.find((child) => {
      return React.isValidElement(child) && child.type === Avatar;
    }) as React.ReactElement;
    info = childrenWithoutControls.find((child) => {
      return React.isValidElement(child) && child.type === ListItemInfo;
    }) as React.ReactElement;

    let infoClone: React.ReactElement | undefined;
    if (typeof info !== "undefined") {
      infoClone = React.cloneElement(info as React.ReactElement, {
        // @ts-ignore - We should look at our cloneElement implementation.
        size,
      });
    }

    const wrapperClasses = classNames(containerClasses, "mv-flex-1");

    return as !== undefined && as.type === "link" ? (
      <li className={listItemClasses}>
        <Link {...as.props}>
          <div className={wrapperClasses}>
            {typeof avatar !== "undefined" && avatar}
            {typeof infoClone !== "undefined" && infoClone}
          </div>
        </Link>
      </li>
    ) : (
      <li className={listItemClasses}>
        <div className={wrapperClasses}>
          {typeof avatar !== "undefined" && avatar}
          {typeof infoClone !== "undefined" && infoClone}
        </div>
      </li>
    );
  }

  avatar = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Avatar;
  }) as React.ReactElement;
  info = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === ListItemInfo;
  }) as React.ReactElement;

  let infoClone: React.ReactElement | undefined;
  let title: React.ReactElement | undefined;
  let subtitle: React.ReactElement | undefined;

  if (typeof info !== "undefined") {
    infoClone = React.cloneElement(info as React.ReactElement, {
      // @ts-ignore - We should look at our cloneElement implementation.
      size,
    });
  } else {
    title = validChildren.find((child) => {
      return React.isValidElement(child) && child.type === ListItemTitle;
    }) as React.ReactElement;
    subtitle = validChildren.find((child) => {
      return React.isValidElement(child) && child.type === ListItemSubtitle;
    }) as React.ReactElement;
  }

  let titleClone: React.ReactElement | undefined;
  let subtitleClone: React.ReactElement | undefined;

  if (typeof title !== "undefined") {
    titleClone = React.cloneElement(title as React.ReactElement, {
      // @ts-ignore - We should look at our cloneElement implementation.
      size,
    });
  }
  if (typeof subtitle !== "undefined") {
    subtitleClone = React.cloneElement(subtitle as React.ReactElement, {
      // @ts-ignore - We should look at our cloneElement implementation.
      size,
    });
  }

  const preview = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === ListItemPreview;
  });

  return as !== undefined && as.type === "link" ? (
    <li className={listItemClasses}>
      <Link {...as.props}>
        {typeof preview !== "undefined" && (
          <div className="mv-w-[138px] mv-h-[92px]">{preview}</div>
        )}
        {typeof avatar === "undefined" &&
        typeof info === "undefined" &&
        typeof infoClone === "undefined" ? null : (
          <div className={containerClasses}>
            {typeof avatar !== "undefined" && avatar}
            {typeof infoClone !== "undefined" ? (
              infoClone
            ) : (
              <ListItemInfo size={size}>
                {typeof titleClone !== "undefined" && titleClone}
                {typeof subtitleClone !== "undefined" && subtitleClone}
              </ListItemInfo>
            )}
            {typeof controls !== "undefined" && controls}
          </div>
        )}
      </Link>
    </li>
  ) : (
    <li className={listItemClasses}>
      {typeof preview !== "undefined" && (
        <div className="mv-w-[138px] mv-h-[92px]">{preview}</div>
      )}
      {typeof avatar === "undefined" &&
      typeof info === "undefined" &&
      typeof infoClone === "undefined" ? null : (
        <div className={containerClasses}>
          {typeof avatar !== "undefined" && avatar}
          {typeof infoClone !== "undefined" ? (
            infoClone
          ) : (
            <ListItemInfo size={size}>
              {typeof titleClone !== "undefined" && titleClone}
              {typeof subtitleClone !== "undefined" && subtitleClone}
            </ListItemInfo>
          )}
          {typeof controls !== "undefined" && controls}
        </div>
      )}
    </li>
  );
}

ListItem.Info = ListItemInfo;
ListItem.Controls = ListItemControls;
ListItem.Title = ListItemTitle;
ListItem.Subtitle = ListItemSubtitle;
ListItem.Preview = ListItemPreview;

List.Item = ListItem;

export { List };
