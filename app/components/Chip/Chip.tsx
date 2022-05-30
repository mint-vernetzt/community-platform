export type ChipClickHandler = (slug: ChipProps["slug"]) => void;

export interface ChipProps {
  title: string;
  slug: string;
  isEnabled?: boolean;
  isRemovable?: boolean;
  onClick?: ChipClickHandler;
}

function getClassNames(isEnabled: boolean, tagHandlerIsCallable: boolean) {
  let classesList: string[] = [`badge badge-outline gap-2`];

  if (isEnabled) {
    classesList.push("badge-secondary is-enabled");
  }

  if (!isEnabled && tagHandlerIsCallable) {
    classesList.push("bg-white border-secondary-300 primary-100 is-selectable");
  }

  if (!isEnabled && !tagHandlerIsCallable) {
    classesList.push(
      "bg-white border-primary-100 text-primary-100 is-disabled"
    );
  }

  if (tagHandlerIsCallable) {
    classesList.push("cursor-pointer");
  }

  return classesList.join(" ");
}

export function Chip({
  title,
  slug,
  onClick,
  isRemovable = false,
  isEnabled = false,
}: ChipProps) {
  let tagHandlerIsCallable = typeof onClick === "function";

  return (
    <div
      className={getClassNames(isEnabled, tagHandlerIsCallable)}
      onClick={() => tagHandlerIsCallable && onClick && onClick(slug)}
    >
      {title}
      {isRemovable ? " x" : ""}
    </div>
  );
}

export default Chip;
