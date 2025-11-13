import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { useListContext } from "./List";
import classNames from "classnames";
import { Children, isValidElement } from "react";
import { Link } from "react-router";

// Design:
// Name: List item (Person & Org)
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10065-3526&t=RJvvlCKHSMjVtZMO-4
function ListItemPersonOrg(props: {
  children: React.ReactNode;
  index: number;
  to?: string;
}) {
  const { children, index, to } = props;
  const { hideAfter } = useListContext();

  const classes = classNames(
    "flex gap-4 items-center p-4 border border-neutral-200 rounded-lg"
  );

  const hideClasses = classNames(
    typeof hideAfter !== "undefined" && index > hideAfter - 1
      ? "hidden group-has-[:checked]:block"
      : "block"
  );

  const validChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child);
  });

  const avatar = validChildren.find((child) => {
    return isValidElement(child) && child.type === Avatar;
  });
  const headline = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemPersonOrg.Headline;
  });
  const subline = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemPersonOrg.Subline;
  });

  if (typeof to === "undefined") {
    return (
      <li className={hideClasses}>
        <div className={classes}>
          <div className="flex gap-1">
            <div className="w-12 h-12">{avatar}</div>
          </div>
          <div className="flex flex-col self-center text-neutral-700">
            {headline}
            {subline}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className={hideClasses}>
      <Link
        to={to}
        className={classNames(
          classes,
          "focus:ring-2 focus:ring-primary-200 hover:bg-neutral-100 active:bg-primary-50 focus:outline-none"
        )}
        prefetch="intent"
      >
        <div className="flex gap-1">
          <div className="w-12 h-12">{avatar}</div>
        </div>
        <div className="flex flex-col self-center text-neutral-700">
          {headline}
          {subline}
        </div>
      </Link>
    </li>
  );
}

function ListItemHeadline(props: { children: React.ReactNode }) {
  return <div className="font-semibold line-clamp-1">{props.children}</div>;
}

function ListItemSubline(props: { children: React.ReactNode }) {
  return <div className="font-normal line-clamp-1">{props.children}</div>;
}

ListItemPersonOrg.Subline = ListItemSubline;
ListItemPersonOrg.Headline = ListItemHeadline;
ListItemPersonOrg.Avatar = Avatar;

export default ListItemPersonOrg;
