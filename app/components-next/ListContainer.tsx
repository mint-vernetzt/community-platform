import { useTranslation } from "react-i18next";
import { Icon } from "./icons/Icon";

export function ListContainer(
  props: React.PropsWithChildren<{ listKey?: string; hideAfter?: number }>
) {
  const { children, listKey, hideAfter } = props;

  if (listKey === undefined && hideAfter !== undefined) {
    console.error(
      "ListItem: Property `listKey` is required when property `hideAfter` is set to hide list items after a specific number."
    );
  }

  const { t } = useTranslation("components");
  return (
    <ul className="mv-flex mv-flex-col mv-gap-4 @lg:mv-gap-6 mv-group">
      {children}
      {children !== undefined &&
      Array.isArray(children) &&
      hideAfter !== undefined &&
      children.length > hideAfter ? (
        <div
          key={`show-more-${listKey}-container`}
          className="mv-w-full mv-flex mv-justify-center mv-pt-2 mv-text-sm mv-text-neutral-600 mv-font-semibold mv-leading-5 mv-justify-self-center"
        >
          <label
            htmlFor={`show-more-${listKey}`}
            className="mv-flex mv-gap-2 mv-cursor-pointer mv-w-fit"
          >
            <div className="group-has-[:checked]:mv-hidden">
              {t("ListContainer.more", {
                count: children.length - 3,
              })}
            </div>
            <div className="mv-hidden group-has-[:checked]:mv-block">
              {t("ListContainer.less", {
                count: children.length - 3,
              })}
            </div>
            <div className="mv-rotate-90 group-has-[:checked]:-mv-rotate-90">
              <Icon type="chevron-right" />
            </div>
          </label>
          <input
            id={`show-more-${listKey}`}
            type="checkbox"
            className="mv-w-0 mv-h-0 mv-opacity-0"
          />
        </div>
      ) : null}
    </ul>
  );
}
