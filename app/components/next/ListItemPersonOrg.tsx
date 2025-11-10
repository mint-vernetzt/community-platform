import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { useListContext } from "./List";
import classNames from "classnames";
import { Children, isValidElement } from "react";

function ListItemPersonOrg(props: {
  children: React.ReactNode;
  index: number;
}) {
  const { children, index } = props;
  const { hideAfter } = useListContext();

  const classes = classNames(
    typeof hideAfter !== "undefined" && index > hideAfter - 1
      ? "hidden group-has-[:checked]:flex"
      : "flex",
    "gap-4 align-center py-4 md:px-4 border-0 md:border border-neutral-200 rounded-lg"
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

  return (
    <div className={classes}>
      <div className="flex gap-1">
        <div className="w-12 h-12">{avatar}</div>
      </div>
      <div className="flex flex-col self-center text-neutral-700">
        {headline}
        {subline}
      </div>
    </div>
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
