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
    <>
      <div className="mv-flex mv-flex-row mv-w-full mv-items-center mv-rounded-lg mv-bg-white	mv-border mv-border-neutral-100 mv-overflow-hidden mv-gap-4 hover:mv-bg-neutral-100">
        <div className="mv-shrink-0 mv-w-36 mv-aspect-[3/2] mv-self-stretch mv-bg-primary-100 mv-flex mv-justify-center mv-items-center mv-text-primary">
          {materialItem.filetype == "jpg" && materialItem.filetype !== null && (
            <img
              src={materialItem.file}
              className="mv-w-full mv-h-full mv-object-contain"
              alt=""
            />
          )}
          {materialItem.filetype == "png" && materialItem.filetype !== null && (
            <img
              src={materialItem.file}
              className="mv-w-full mv-h-full mv-object-contain"
              alt=""
            />
          )}
          {materialItem.filetype == "pdf" && materialItem.filetype !== null && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="none"
              className="mv-w-9 mv-h-9"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M14 4.5V14C14 15.1046 13.1046 16 12 16H11V15H12C12.5523 15 13 14.5523 13 14V4.5H11C10.1716 4.5 9.5 3.82843 9.5 3V1H4C3.44772 1 3 1.44772 3 2V11H2V2C2 0.89543 2.89543 0 4 0H9.5L14 4.5ZM1.59961 11.85H0V15.849H0.791016V14.5072H1.59375C1.88086 14.5072 2.125 14.4496 2.32617 14.3344C2.5293 14.2172 2.68359 14.059 2.78906 13.8598C2.89648 13.6586 2.9502 13.433 2.9502 13.183C2.9502 12.933 2.89746 12.7074 2.79199 12.5063C2.68652 12.3051 2.5332 12.1459 2.33203 12.0287C2.13281 11.9096 1.88867 11.85 1.59961 11.85ZM2.14453 13.183C2.14453 13.3315 2.11621 13.4584 2.05957 13.5639C2.00488 13.6674 1.92578 13.7475 1.82227 13.8041C1.71875 13.8588 1.59375 13.8861 1.44727 13.8861H0.788086V12.4799H1.44727C1.66602 12.4799 1.83691 12.5404 1.95996 12.6615C2.08301 12.7826 2.14453 12.9565 2.14453 13.183ZM3.36211 11.85V15.849H4.82109C5.22344 15.849 5.55645 15.7699 5.82012 15.6117C6.08574 15.4535 6.28398 15.224 6.41484 14.9232C6.5457 14.6225 6.61113 14.2611 6.61113 13.8393C6.61113 13.4193 6.5457 13.0609 6.41484 12.7641C6.28594 12.4672 6.08965 12.2406 5.82598 12.0844C5.5623 11.9281 5.22734 11.85 4.82109 11.85H3.36211ZM4.15312 12.4945H4.71562C4.96367 12.4945 5.1668 12.5453 5.325 12.6469C5.48516 12.7484 5.60332 12.8998 5.67949 13.101C5.75762 13.3022 5.79668 13.5531 5.79668 13.8539C5.79668 14.0805 5.77422 14.2777 5.7293 14.4457C5.68633 14.6137 5.6209 14.7543 5.53301 14.8676C5.44707 14.9789 5.33574 15.0629 5.19902 15.1195C5.0623 15.1742 4.90117 15.2016 4.71562 15.2016H4.15312V12.4945ZM7.89609 14.2582V15.849H7.10508V11.85H9.65391V12.5033H7.89609V13.6195H9.50156V14.2582H7.89609Z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
        <div className="mv-py-4 mv-shrink-1 mv-grow-1">
          <div className="md:mv-flex md:mv-flex-row md:mv-flex-nowrap mv-mb-1 mv-gap-1">
            <h4 className="mv-font-bold mv-mb-0 mv-truncate mv-shrink-1 mv-grow-1 mv-text-primary mv-text-base mv-leading-5">
              {materialItem.name}
            </h4>
            <div className="mv-shrink-0 md:mv-text-primary mv-text-xs md:mv-text-base md:mv-leading-5">
              ({materialItem.filetype}, {materialItem.filesize})
            </div>
          </div>

          {typeof materialItem.excerpt !== "undefined" &&
            materialItem.excerpt !== null && (
              <div className="mv-mb-1">
                <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-hidden md:mv-line-clamp-1">
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
        <div className="mv-p-4 mv-shrink-0 mv-hidden mv-ml-auto lg:mv-block">
          <Button variant="outline" className="lg:mv-hidden">
            Herunterladen
          </Button>
        </div>
        <div className="mv-p-4 mv-pl-0 mv-shrink-0 mv-ml-auto lg:mv-hidden">
          <CircleButton variant="ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M0.5 9.90002C0.776142 9.90002 1 10.1239 1 10.4V12.9C1 13.4523 1.44772 13.9 2 13.9H14C14.5523 13.9 15 13.4523 15 12.9V10.4C15 10.1239 15.2239 9.90002 15.5 9.90002C15.7761 9.90002 16 10.1239 16 10.4V12.9C16 14.0046 15.1046 14.9 14 14.9H2C0.895431 14.9 0 14.0046 0 12.9V10.4C0 10.1239 0.223858 9.90002 0.5 9.90002Z"
                fill="currentColor"
              />
              <path
                d="M7.64645 11.8536C7.84171 12.0488 8.15829 12.0488 8.35355 11.8536L11.3536 8.85355C11.5488 8.65829 11.5488 8.34171 11.3536 8.14645C11.1583 7.95118 10.8417 7.95118 10.6464 8.14645L8.5 10.2929V1.5C8.5 1.22386 8.27614 1 8 1C7.72386 1 7.5 1.22386 7.5 1.5V10.2929L5.35355 8.14645C5.15829 7.95118 4.84171 7.95118 4.64645 8.14645C4.45118 8.34171 4.45118 8.65829 4.64645 8.85355L7.64645 11.8536Z"
                fill="currentColor"
              />
            </svg>
          </CircleButton>
        </div>
      </div>

      <div className="mv-flex mv-flex-row mv-w-full mv-items-center mv-rounded-lg mv-bg-white	mv-border mv-border-neutral-100 mv-overflow-hidden mv-gap-4 hover:mv-bg-neutral-100">
        <div className="mv-shrink-0 mv-w-36 mv-aspect-[3/2] mv-self-stretch mv-bg-primary-100 mv-flex mv-justify-center mv-items-center mv-text-primary">
          {materialItem.filetype == "jpg" && materialItem.filetype !== null && (
            <img
              src={materialItem.file}
              className="mv-w-full mv-h-full mv-object-cover"
              alt=""
            />
          )}
          {materialItem.filetype == "png" && materialItem.filetype !== null && (
            <img
              src={materialItem.file}
              className="mv-w-full mv-h-full mv-object-contain"
              alt=""
            />
          )}
          {materialItem.filetype == "pdf" && materialItem.filetype !== null && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="none"
              className="mv-w-9 mv-h-9"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M14 4.5V14C14 15.1046 13.1046 16 12 16H11V15H12C12.5523 15 13 14.5523 13 14V4.5H11C10.1716 4.5 9.5 3.82843 9.5 3V1H4C3.44772 1 3 1.44772 3 2V11H2V2C2 0.89543 2.89543 0 4 0H9.5L14 4.5ZM1.59961 11.85H0V15.849H0.791016V14.5072H1.59375C1.88086 14.5072 2.125 14.4496 2.32617 14.3344C2.5293 14.2172 2.68359 14.059 2.78906 13.8598C2.89648 13.6586 2.9502 13.433 2.9502 13.183C2.9502 12.933 2.89746 12.7074 2.79199 12.5063C2.68652 12.3051 2.5332 12.1459 2.33203 12.0287C2.13281 11.9096 1.88867 11.85 1.59961 11.85ZM2.14453 13.183C2.14453 13.3315 2.11621 13.4584 2.05957 13.5639C2.00488 13.6674 1.92578 13.7475 1.82227 13.8041C1.71875 13.8588 1.59375 13.8861 1.44727 13.8861H0.788086V12.4799H1.44727C1.66602 12.4799 1.83691 12.5404 1.95996 12.6615C2.08301 12.7826 2.14453 12.9565 2.14453 13.183ZM3.36211 11.85V15.849H4.82109C5.22344 15.849 5.55645 15.7699 5.82012 15.6117C6.08574 15.4535 6.28398 15.224 6.41484 14.9232C6.5457 14.6225 6.61113 14.2611 6.61113 13.8393C6.61113 13.4193 6.5457 13.0609 6.41484 12.7641C6.28594 12.4672 6.08965 12.2406 5.82598 12.0844C5.5623 11.9281 5.22734 11.85 4.82109 11.85H3.36211ZM4.15312 12.4945H4.71562C4.96367 12.4945 5.1668 12.5453 5.325 12.6469C5.48516 12.7484 5.60332 12.8998 5.67949 13.101C5.75762 13.3022 5.79668 13.5531 5.79668 13.8539C5.79668 14.0805 5.77422 14.2777 5.7293 14.4457C5.68633 14.6137 5.6209 14.7543 5.53301 14.8676C5.44707 14.9789 5.33574 15.0629 5.19902 15.1195C5.0623 15.1742 4.90117 15.2016 4.71562 15.2016H4.15312V12.4945ZM7.89609 14.2582V15.849H7.10508V11.85H9.65391V12.5033H7.89609V13.6195H9.50156V14.2582H7.89609Z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
        <div className="mv-py-4 mv-shrink-1 mv-grow-1">
          <div className="md:mv-flex md:mv-flex-row md:mv-flex-nowrap mv-mb-1 mv-gap-1">
            <h4 className="mv-font-bold mv-mb-0 mv-truncate mv-shrink-1 mv-grow-1 mv-text-primary mv-text-base mv-leading-5">
              {materialItem.name}
            </h4>
            <div className="mv-shrink-0 md:mv-text-primary mv-text-xs md:mv-text-base md:mv-leading-5">
              ({materialItem.filetype}, {materialItem.filesize})
            </div>
          </div>

          {typeof materialItem.excerpt !== "undefined" &&
            materialItem.excerpt !== null && (
              <div className="mv-mb-1">
                <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-hidden md:mv-line-clamp-1">
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
        <div className="mv-p-4 mv-shrink-0 mv-hidden lg:mv-flex lg:mv-gap-4 mv-ml-auto">
          <CircleButton variant="ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M6.875 6.875C7.22018 6.875 7.5 7.15482 7.5 7.5V15C7.5 15.3452 7.22018 15.625 6.875 15.625C6.52982 15.625 6.25 15.3452 6.25 15V7.5C6.25 7.15482 6.52982 6.875 6.875 6.875Z"
                fill="currentColor"
              />
              <path
                d="M10 6.875C10.3452 6.875 10.625 7.15482 10.625 7.5V15C10.625 15.3452 10.3452 15.625 10 15.625C9.65482 15.625 9.375 15.3452 9.375 15V7.5C9.375 7.15482 9.65482 6.875 10 6.875Z"
                fill="currentColor"
              />
              <path
                d="M13.75 7.5C13.75 7.15482 13.4702 6.875 13.125 6.875C12.7798 6.875 12.5 7.15482 12.5 7.5V15C12.5 15.3452 12.7798 15.625 13.125 15.625C13.4702 15.625 13.75 15.3452 13.75 15V7.5Z"
                fill="currentColor"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M18.125 3.75C18.125 4.44036 17.5654 5 16.875 5H16.25V16.25C16.25 17.6307 15.1307 18.75 13.75 18.75H6.25C4.86929 18.75 3.75 17.6307 3.75 16.25V5H3.125C2.43464 5 1.875 4.44036 1.875 3.75V2.5C1.875 1.80964 2.43464 1.25 3.125 1.25H7.5C7.5 0.559644 8.05964 0 8.75 0H11.25C11.9404 0 12.5 0.559644 12.5 1.25H16.875C17.5654 1.25 18.125 1.80964 18.125 2.5V3.75ZM5.14754 5L5 5.07377V16.25C5 16.9404 5.55964 17.5 6.25 17.5H13.75C14.4404 17.5 15 16.9404 15 16.25V5.07377L14.8525 5H5.14754ZM3.125 3.75V2.5H16.875V3.75H3.125Z"
                fill="currentColor"
              />
            </svg>
          </CircleButton>
          <CircleButton variant="ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M15.1831 0.183058C15.4272 -0.0610194 15.8229 -0.0610194 16.067 0.183058L19.817 3.93306C20.061 4.17714 20.061 4.57286 19.817 4.81694L7.31696 17.3169C7.25711 17.3768 7.18573 17.4239 7.10714 17.4553L0.857137 19.9553C0.625002 20.0482 0.359866 19.9937 0.183076 19.8169C0.00628736 19.6402 -0.0481339 19.375 0.0447203 19.1429L2.54472 12.8929C2.57616 12.8143 2.62323 12.7429 2.68308 12.6831L15.1831 0.183058ZM14.0089 3.125L16.875 5.99112L18.4911 4.375L15.625 1.50888L14.0089 3.125ZM15.9911 6.875L13.125 4.00888L5.00002 12.1339V12.5H5.62502C5.9702 12.5 6.25002 12.7798 6.25002 13.125V13.75H6.87502C7.2202 13.75 7.50002 14.0298 7.50002 14.375V15H7.86613L15.9911 6.875ZM3.78958 13.3443L3.65767 13.4762L1.74693 18.2531L6.52379 16.3423L6.6557 16.2104C6.41871 16.1216 6.25002 15.893 6.25002 15.625V15H5.62502C5.27984 15 5.00002 14.7202 5.00002 14.375V13.75H4.37502C4.10701 13.75 3.87841 13.5813 3.78958 13.3443Z"
                fill="currentColor"
              />
            </svg>
          </CircleButton>
          <CircleButton variant="ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M0.5 9.90002C0.776142 9.90002 1 10.1239 1 10.4V12.9C1 13.4523 1.44772 13.9 2 13.9H14C14.5523 13.9 15 13.4523 15 12.9V10.4C15 10.1239 15.2239 9.90002 15.5 9.90002C15.7761 9.90002 16 10.1239 16 10.4V12.9C16 14.0046 15.1046 14.9 14 14.9H2C0.895431 14.9 0 14.0046 0 12.9V10.4C0 10.1239 0.223858 9.90002 0.5 9.90002Z"
                fill="currentColor"
              />
              <path
                d="M7.64645 11.8536C7.84171 12.0488 8.15829 12.0488 8.35355 11.8536L11.3536 8.85355C11.5488 8.65829 11.5488 8.34171 11.3536 8.14645C11.1583 7.95118 10.8417 7.95118 10.6464 8.14645L8.5 10.2929V1.5C8.5 1.22386 8.27614 1 8 1C7.72386 1 7.5 1.22386 7.5 1.5V10.2929L5.35355 8.14645C5.15829 7.95118 4.84171 7.95118 4.64645 8.14645C4.45118 8.34171 4.45118 8.65829 4.64645 8.85355L7.64645 11.8536Z"
                fill="currentColor"
              />
            </svg>
          </CircleButton>
        </div>
        <div className="mv-p-4 mv-pl-0 mv-shrink-0  mv-ml-auto lg:mv-hidden">
          <CircleButton variant="ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M9.5 13C9.5 13.8284 8.82843 14.5 8 14.5C7.17157 14.5 6.5 13.8284 6.5 13C6.5 12.1716 7.17157 11.5 8 11.5C8.82843 11.5 9.5 12.1716 9.5 13ZM9.5 8C9.5 8.82843 8.82843 9.5 8 9.5C7.17157 9.5 6.5 8.82843 6.5 8C6.5 7.17157 7.17157 6.5 8 6.5C8.82843 6.5 9.5 7.17157 9.5 8ZM9.5 3C9.5 3.82843 8.82843 4.5 8 4.5C7.17157 4.5 6.5 3.82843 6.5 3C6.5 2.17157 7.17157 1.5 8 1.5C8.82843 1.5 9.5 2.17157 9.5 3Z"
                fill="currentColor"
              />
            </svg>
          </CircleButton>
        </div>
      </div>
    </>
  );
}

export default MaterialCard;
