import { CircleButton, Image, TextButton } from "@mint-vernetzt/components";
import { Link } from "@remix-run/react";
import React, { type PropsWithChildren } from "react";

export type BackButtonProps = {
  to: string;
};

export function BackButton(props: PropsWithChildren<BackButtonProps>) {
  return (
    <div className="@md:mv-hidden">
      <TextButton arrowLeft size="large">
        <Link to={props.to} prefetch="intent">
          {props.children}
        </Link>
      </TextButton>
    </div>
  );
}

export function MaterialList(props: PropsWithChildren<unknown>) {
  return (
    <ul className="mv-list-none mv-max-w-full mv-flex mv-gap-4 mv-flex-col">
      {props.children}
    </ul>
  );
}

export function PDFIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      className="mv-w-9 mv-h-9"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 4.5V14C14 15.1046 13.1046 16 12 16H11V15H12C12.5523 15 13 14.5523 13 14V4.5H11C10.1716 4.5 9.5 3.82843 9.5 3V1H4C3.44772 1 3 1.44772 3 2V11H2V2C2 0.89543 2.89543 0 4 0H9.5L14 4.5ZM1.59961 11.85H0V15.849H0.791016V14.5072H1.59375C1.88086 14.5072 2.125 14.4496 2.32617 14.3344C2.5293 14.2172 2.68359 14.059 2.78906 13.8598C2.89648 13.6586 2.9502 13.433 2.9502 13.183C2.9502 12.933 2.89746 12.7074 2.79199 12.5063C2.68652 12.3051 2.5332 12.1459 2.33203 12.0287C2.13281 11.9096 1.88867 11.85 1.59961 11.85ZM2.14453 13.183C2.14453 13.3315 2.11621 13.4584 2.05957 13.5639C2.00488 13.6674 1.92578 13.7475 1.82227 13.8041C1.71875 13.8588 1.59375 13.8861 1.44727 13.8861H0.788086V12.4799H1.44727C1.66602 12.4799 1.83691 12.5404 1.95996 12.6615C2.08301 12.7826 2.14453 12.9565 2.14453 13.183ZM3.36211 11.85V15.849H4.82109C5.22344 15.849 5.55645 15.7699 5.82012 15.6117C6.08574 15.4535 6.28398 15.224 6.41484 14.9232C6.5457 14.6225 6.61113 14.2611 6.61113 13.8393C6.61113 13.4193 6.5457 13.0609 6.41484 12.7641C6.28594 12.4672 6.08965 12.2406 5.82598 12.0844C5.5623 11.9281 5.22734 11.85 4.82109 11.85H3.36211ZM4.15312 12.4945H4.71562C4.96367 12.4945 5.1668 12.5453 5.325 12.6469C5.48516 12.7484 5.60332 12.8998 5.67949 13.101C5.75762 13.3022 5.79668 13.5531 5.79668 13.8539C5.79668 14.0805 5.77422 14.2777 5.7293 14.4457C5.68633 14.6137 5.6209 14.7543 5.53301 14.8676C5.44707 14.9789 5.33574 15.0629 5.19902 15.1195C5.0623 15.1742 4.90117 15.2016 4.71562 15.2016H4.15312V12.4945ZM7.89609 14.2582V15.849H7.10508V11.85H9.65391V12.5033H7.89609V13.6195H9.50156V14.2582H7.89609Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function JPGIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M31.5 10.126V31.501C31.5 33.9863 29.4853 36.001 27 36.001H24.75V33.751H27C28.2426 33.751 29.25 32.7436 29.25 31.501V10.126H24.75C22.886 10.126 21.375 8.61494 21.375 6.75098V2.25098H9C7.75736 2.25098 6.75 3.25834 6.75 4.50098V24.751H4.5V4.50098C4.5 2.01569 6.51472 0.000976562 9 0.000976562H21.375L31.5 10.126ZM21.7345 28.4235C21.9059 28.7663 22.0113 29.1354 22.0509 29.5309H20.3041C20.2601 29.3244 20.1876 29.1376 20.0865 28.9706C19.9854 28.8036 19.858 28.6608 19.7042 28.5422C19.5548 28.4191 19.3768 28.3246 19.1703 28.2587C18.9681 28.1928 18.744 28.1598 18.4979 28.1598C17.8563 28.1598 17.3575 28.3861 17.0016 28.8388C16.65 29.2914 16.4742 29.9286 16.4742 30.7504V31.871C16.4742 32.3984 16.5467 32.8598 16.6917 33.2553C16.8412 33.6508 17.0697 33.9606 17.3773 34.1847C17.6849 34.4045 18.0738 34.5143 18.544 34.5143C18.9571 34.5143 19.2999 34.4418 19.5724 34.2968C19.8448 34.1474 20.0492 33.9496 20.1854 33.7035C20.3216 33.4574 20.3897 33.185 20.3897 32.8861V32.3127H18.5375V30.9877H22.0838V32.7807C22.0838 33.2157 22.0113 33.6288 21.8663 34.0199C21.7213 34.4067 21.5016 34.7494 21.2071 35.0483C20.9127 35.3471 20.5414 35.5822 20.0931 35.7536C19.6493 35.9206 19.1263 36.0041 18.5243 36.0041C17.8783 36.0041 17.3136 35.9052 16.8302 35.7074C16.3512 35.5053 15.9513 35.2218 15.6305 34.8571C15.3097 34.4923 15.0702 34.0573 14.912 33.5519C14.7538 33.0465 14.6747 32.4884 14.6747 31.8776V30.7372C14.6747 29.9242 14.8241 29.2123 15.1229 28.6015C15.4261 27.9906 15.8634 27.516 16.4347 27.1777C17.0104 26.8349 17.7047 26.6635 18.5177 26.6635C19.0538 26.6635 19.5306 26.7382 19.9481 26.8876C20.37 27.037 20.7303 27.2436 21.0292 27.5072C21.328 27.7709 21.5631 28.0763 21.7345 28.4235ZM0 33.2685C0 33.6376 0.0615234 33.987 0.18457 34.3166C0.307617 34.6462 0.48999 34.9384 0.731689 35.1933C0.977783 35.4482 1.2832 35.6481 1.64795 35.7931C2.01709 35.9338 2.44336 36.0041 2.92676 36.0041C3.87158 36.0041 4.60986 35.7448 5.1416 35.2262C5.67773 34.7077 5.9458 33.954 5.9458 32.9652V26.8349H4.16602V33.0114C4.16602 33.464 4.06274 33.8134 3.8562 34.0595C3.64966 34.3056 3.33325 34.4286 2.90698 34.4286C2.67847 34.4286 2.47632 34.3803 2.30054 34.2836C2.12476 34.1825 1.98633 34.0463 1.88525 33.8749C1.78418 33.6991 1.72925 33.497 1.72046 33.2685H0ZM11.0716 26.8349H7.47246V35.8327H9.25225V32.8136H11.0584C11.7044 32.8136 12.2537 32.684 12.7063 32.4247C13.1634 32.161 13.5105 31.8051 13.7479 31.3568C13.9896 30.9042 14.1104 30.3966 14.1104 29.8341C14.1104 29.2716 13.9917 28.7641 13.7544 28.3114C13.5171 27.8588 13.1722 27.5006 12.7195 27.237C12.2713 26.9689 11.722 26.8349 11.0716 26.8349ZM12.2977 29.8341C12.2977 30.1681 12.2339 30.4538 12.1065 30.6911C11.9834 30.924 11.8055 31.1042 11.5726 31.2316C11.3396 31.3547 11.0584 31.4162 10.7288 31.4162H9.24565V28.2521H10.7288C11.221 28.2521 11.6055 28.3883 11.8824 28.6608C12.1592 28.9333 12.2977 29.3244 12.2977 29.8341Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MaterialListItemTitle(props: PropsWithChildren<unknown>) {
  return <>{props.children}</>;
}

export function MaterialListItemMeta(props: PropsWithChildren<unknown>) {
  return (
    <span className="mv-text-primary mv-text-base mv-font-normal">
      {" "}
      {props.children}
    </span>
  );
}

export function MaterialListItemParagraph(props: PropsWithChildren<unknown>) {
  return (
    <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-hidden @md:mv-line-clamp-1">
      {props.children}
    </p>
  );
}

export function MaterialListItemControls(props: PropsWithChildren<unknown>) {
  return (
    <div className="mv-p-4 mv-shrink-0 mv-flex mv-gap-4 mv-ml-auto">
      {props.children}
    </div>
  );
}
export function MaterialListItemControlsDelete(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <CircleButton variant="ghost" {...props}>
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
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18.125 3.75C18.125 4.44036 17.5654 5 16.875 5H16.25V16.25C16.25 17.6307 15.1307 18.75 13.75 18.75H6.25C4.86929 18.75 3.75 17.6307 3.75 16.25V5H3.125C2.43464 5 1.875 4.44036 1.875 3.75V2.5C1.875 1.80964 2.43464 1.25 3.125 1.25H7.5C7.5 0.559644 8.05964 0 8.75 0H11.25C11.9404 0 12.5 0.559644 12.5 1.25H16.875C17.5654 1.25 18.125 1.80964 18.125 2.5V3.75ZM5.14754 5L5 5.07377V16.25C5 16.9404 5.55964 17.5 6.25 17.5H13.75C14.4404 17.5 15 16.9404 15 16.25V5.07377L14.8525 5H5.14754ZM3.125 3.75V2.5H16.875V3.75H3.125Z"
          fill="currentColor"
        />
      </svg>
    </CircleButton>
  );
}

export function MaterialListItemControlsEdit() {
  return (
    <div className="mv-text-primary hover:mv-text-primary-700 hover:mv-bg-neutral-50 focus:mv-text-primary-700 focus:mv-bg-neutral-50 active:mv-bg-neutral-100 mv-rounded-full mv-w-12 mv-h-12 mv-flex mv-justify-center">
      <svg
        className="mv-self-center"
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
    </div>
  );
}

export function MaterialListItemControlsDownload() {
  return (
    <div className="mv-text-primary hover:mv-text-primary-700 hover:mv-bg-neutral-50 focus:mv-text-primary-700 focus:mv-bg-neutral-50 active:mv-bg-neutral-100 mv-rounded-full mv-w-12 mv-h-12 mv-flex mv-justify-center">
      <svg
        className="mv-self-center"
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
    </div>
  );
}

export function MaterialListItem(
  props: PropsWithChildren<unknown> & { id?: string }
) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child) || typeof child === "string";
    }
  );

  const otherChildren = validChildren.filter((child) => {
    return (
      typeof child === "string" ||
      (React.isValidElement(child) &&
        child.type !== Image &&
        child.type !== PDFIcon &&
        child.type !== JPGIcon &&
        child.type !== MaterialListItemTitle &&
        child.type !== MaterialListItemMeta &&
        child.type !== MaterialListItemParagraph)
    );
  });

  const image = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Image;
  });
  const pdfIcon = validChildren.find((child) => {
    return (
      React.isValidElement(child) &&
      (child.type === PDFIcon || child.type === JPGIcon)
    );
  });
  const title = validChildren.find((child) => {
    return (
      typeof child === "string" ||
      (React.isValidElement(child) && child.type === MaterialListItemTitle)
    );
  });

  const meta = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === MaterialListItemMeta;
  });

  const paragraphes = validChildren.filter((child) => {
    return (
      React.isValidElement(child) && child.type === MaterialListItemParagraph
    );
  });

  return (
    // <li className="mv-flex mv-flex-row mv-w-full mv-items-center mv-rounded-lg mv-bg-white	mv-border mv-border-neutral-100 mv-overflow-hidden mv-gap-4 hover:mv-bg-neutral-100">
    <li
      key={props.id}
      className="mv-flex mv-w-full mv-items-center mv-rounded-lg mv-bg-white mv-border mv-border-neutral-100 mv-gap-4 mv-overflow-hidden"
    >
      <div className="mv-shrink-0 mv-w-36 mv-aspect-[3/2] mv-self-stretch mv-bg-primary-100 mv-flex mv-justify-center mv-items-center mv-text-primary mv-hidden @lg:mv-flex">
        {typeof image !== "undefined" && image}
        {typeof pdfIcon !== "undefined" && pdfIcon}
      </div>
      <div className="mv-ml-4 @lg:mv-ml-0 mv-shrink-1 mv-flex mv-flex-col mv-py-4 mv-gap-2 mv-line-clamp-1">
        <h4 className="mv-font-bold mv-mb-0 mv-text-primary mv-text-base mv-truncate mv-overflow-hidden mv-block mv-whitespace-nowrap">
          {typeof title !== "undefined" && title}
          {typeof meta !== "undefined" && meta}
        </h4>
        {paragraphes.map((paragraph, index) => {
          return (
            <React.Fragment key={`${props.id}-${index}`}>
              {paragraph}
            </React.Fragment>
          );
        })}
      </div>
      {otherChildren}
    </li>
  );
}
MaterialListItem.PDFIcon = PDFIcon;
MaterialListItem.JPGIcon = JPGIcon;
MaterialListItem.Title = MaterialListItemTitle;
MaterialListItem.Meta = MaterialListItemMeta;
MaterialListItem.Paragraph = MaterialListItemParagraph;
MaterialListItem.Controls = MaterialListItemControls;
MaterialListItemControls.Delete = MaterialListItemControlsDelete;
MaterialListItemControls.Edit = MaterialListItemControlsEdit;
MaterialListItemControls.Download = MaterialListItemControlsDownload;
MaterialList.Item = MaterialListItem;
