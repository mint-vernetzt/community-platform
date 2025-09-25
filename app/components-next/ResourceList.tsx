import { Children, isValidElement } from "react";

type ResourceListProps = React.PropsWithChildren;

function ResourceList(props: ResourceListProps) {
  const { children } = props;

  const header = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === Header
  );
  const other = Children.toArray(children).filter(
    (child) => isValidElement(child) && child.type !== Header
  );

  return (
    <div className="w-full max-w-[358px] @md:max-w-[740px] @lg:max-w-none flex flex-col @lg:items-center gap-6">
      {header}
      <div className="w-full grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-1 @lg:items-center gap-6">
        {other}
      </div>
    </div>
  );
}

type HeaderProps = React.PropsWithChildren;

function Header(props: HeaderProps) {
  const { children } = props;

  return <div className="w-full flex gap-2 items-center">{children}</div>;
}

type ListItemProps = React.PropsWithChildren;

function ListItem(props: ListItemProps) {
  const { children } = props;

  const imageSection = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === ImageSection
  );
  const contentSection = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === ContentSection
  );
  const actionSection = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === ActionSection
  );

  return (
    <div className="w-full @lg:bg-white rounded-lg overflow-hidden border border-neutral-200 @lg:flex @lg:justify-center @lg:gap-6 @lg:pr-6">
      {imageSection}
      <div className="w-full flex flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-6 p-4 @lg:p-0">
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
      className={`w-full h-36 @lg:w-36 flex items-center justify-center${
        typeof className !== "undefined" ? ` ${className}` : ""
      }`}
    >
      <div className={`h-36 ${fullWidth === false ? "w-36" : "@lg:w-36"}`}>
        {children}
      </div>
    </div>
  );
}

type ContentSectionProps = React.PropsWithChildren;

function ContentSection(props: ContentSectionProps) {
  const { children } = props;

  const contentHeader = Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === Header
  );
  const other = Children.toArray(children).filter(
    (child) => isValidElement(child) && child.type !== Header
  );

  return (
    <div className="w-full flex flex-col gap-2 max-w-[560px] @md:min-h-[132px] @lg:min-h-fit">
      {contentHeader}
      {other}
    </div>
  );
}

type ActionSectionProps = React.PropsWithChildren;

function ActionSection(props: ActionSectionProps) {
  const { children } = props;

  return <div className="flex flex-col gap-2 text-center">{children}</div>;
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
