import React from "react";

type ResourceListProps = React.PropsWithChildren;

function ResourceList(props: ResourceListProps) {
  const { children } = props;

  const header = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === Header
  );
  const other = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type !== Header
  );

  return (
    <div className="mv-w-full mv-max-w-[358px] @md:mv-max-w-[740px] @lg:mv-max-w-none mv-flex mv-flex-col @lg:mv-items-center mv-gap-6">
      {header}
      <div className="mv-w-full mv-grid mv-grid-cols-1 @md:mv-grid-cols-2 @lg:mv-grid-cols-1 @lg:mv-items-center mv-gap-6">
        {other}
      </div>
    </div>
  );
}

type HeaderProps = React.PropsWithChildren;

function Header(props: HeaderProps) {
  const { children } = props;

  return (
    <div className="mv-w-full mv-flex mv-gap-2 mv-items-center">{children}</div>
  );
}

type ListItemProps = React.PropsWithChildren;

function ListItem(props: ListItemProps) {
  const { children } = props;

  const imageSection = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === ImageSection
  );
  const contentSection = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === ContentSection
  );
  const actionSection = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === ActionSection
  );

  return (
    <div className="mv-w-full @lg:mv-bg-white mv-rounded-lg mv-overflow-hidden mv-border mv-border-neutral-200 @lg:mv-flex @lg:mv-justify-center @lg:mv-gap-6 @lg:mv-pr-6">
      {imageSection}
      <div className="mv-w-full mv-flex mv-flex-col @lg:mv-flex-row @lg:mv-justify-between @lg:mv-items-center mv-gap-6 mv-p-4 @lg:mv-p-0">
        {contentSection}
        {actionSection}
      </div>
    </div>
  );
}

type ImageSectionProps = React.PropsWithChildren &
  Pick<React.HTMLProps<HTMLDivElement>, "className"> & {
    fullWidth?: boolean;
  };

function ImageSection(props: ImageSectionProps) {
  const { children, className, fullWidth = false } = props;

  return (
    <div
      className={`mv-w-full mv-h-36 @lg:mv-w-36 mv-flex mv-items-center mv-justify-center${
        typeof className !== "undefined" ? ` ${className}` : ""
      }`}
    >
      <div
        className={`mv-h-36 ${fullWidth === false ? "mv-w-36" : "@lg:mv-w-36"}`}
      >
        {children}
      </div>
    </div>
  );
}

type ContentSectionProps = React.PropsWithChildren;

function ContentSection(props: ContentSectionProps) {
  const { children } = props;

  const contentHeader = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === Header
  );
  const other = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type !== Header
  );

  return (
    <div className="mv-w-full mv-flex mv-flex-col mv-gap-2 mv-max-w-[560px] @md:mv-min-h-[132px] @lg:mv-min-h-fit">
      {contentHeader}
      {other}
    </div>
  );
}

type ActionSectionProps = React.PropsWithChildren;

function ActionSection(props: ActionSectionProps) {
  const { children } = props;

  return (
    <div className="mv-flex mv-flex-col mv-gap-2 mv-text-center">
      {children}
    </div>
  );
}

ContentSection.Header = Header;

ListItem.ImageSection = ImageSection;
ListItem.ContentSection = ContentSection;
ListItem.ActionSection = ActionSection;
ListItem.ContentSection.Header = Header;

ResourceList.Header = Header;
ResourceList.ListItem = ListItem;
ResourceList.ListItem.ImageSection = ImageSection;
ResourceList.ListItem.ContentSection = ContentSection;
ResourceList.ListItem.ContentSection.Header = Header;
ResourceList.ListItem.ActionSection = ActionSection;

export default ResourceList;
