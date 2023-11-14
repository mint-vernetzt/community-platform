import Button from "../../molecules/Button";
import CircleButton from "../../molecules/CircleButton";
import { removeHtmlTags } from "../../../../../app/lib/utils/sanitizeUserHtml";
import { Card } from "./Card";

export type MaterialCardProps = {
  materialItem: {
    name: string;
    slug: string;
    file?: string | null;
    filetype?: string | null;
    filesize?: string | null;
    excerpt?: string | null;
    credit?: string | null;
  };
};

function MaterialCard(props: MaterialCardProps) {
  const { materialItem } = props;
  return (
    <div className="mv-flex mv-flex-row mv-w-full mv-items-center mv-rounded-lg mv-bg-white	mv-border mv-border-neutral-100 mv-overflow-hidden mv-gap-4">
      <div className="mv-shrink-0 mv-w-36 mv-self-stretch mv-bg-white">
        {materialItem.filetype == "jpg" && materialItem.filetype !== null && (
          <img
            src={materialItem.file}
            className="mv-w-full mv-h-full mv-object-cover"
            alt=""
          />
        )}
      </div>
      <div className="mv-py-4 mv-shrink-1 mv-grow-1">
        <div className="mv-flex mv-flex-row mv-flex-nowrap mv-text-primary mv-text-base mv-leading-5 mv-mb-1 mv-gap-1">
          <h4 className="mv-font-bold mv-mb-0 mv-truncate mv-shrink-1 mv-grow-1">
            {materialItem.name}
          </h4>
          <div className="mv-shrink-0">
            ({materialItem.filetype}, {materialItem.filesize})
          </div>
        </div>

        {typeof materialItem.excerpt !== "undefined" &&
          materialItem.excerpt !== null && (
            <div className="mv-mb-1">
              <p className="mv-text-neutral-700 mv-text-xs md:mv-text-sm mv-leading-5 mv-line-clamp-1">
                {removeHtmlTags(materialItem.excerpt)}
              </p>
            </div>
          )}
        {typeof materialItem.credit !== "undefined" &&
          materialItem.credit !== null && (
            <div className="">
              <p className="mv-text-neutral-700 mv-text-xs md:mv-text-sm mv-leading-5">
                Foto-Credit: {materialItem.credit}
              </p>
            </div>
          )}
      </div>
      <div className="mv-p-4 mv-shrink-0 mv-hidden lg:mv-block">
        <Button variant="outline" className="lg:mv-hidden">
          Herunterladen
        </Button>
      </div>
      <div className="mv-p-4 mv-pl-0 mv-shrink-0 lg:mv-hidden">
        <CircleButton>I</CircleButton>
      </div>
    </div>
  );
}

export default MaterialCard;
