import classNames from "classnames";
import React, { PropsWithChildren } from "react";

export function Container(props: { children: React.ReactNode }) {
  return (
    <div className="mv-w-full mv-h-full mv-flex mv-justify-center">
      <div className="mv-w-full mv-py-6 mv-px-4 @lg:mv-py-8 @md:mv-px-6 @lg:mv-px-8 mv-flex mv-flex-col mv-gap-6 mv-mb-10 @sm:mv-mb-[72px] @lg:mv-mb-16 mv-max-w-screen-2xl">
        {props.children}
      </div>
    </div>
  );
}

export function ContainerHeader(props: { children: React.ReactNode }) {
  return (
    <div className="mv-flex mv-flex-col @sm:mv-flex-row mv-gap-4 @md:mv-gap-6 @lg:mv-gap-8 mv-items-center mv-justify-between">
      {props.children}
    </div>
  );
}

export function ContainerTitle(props: { children: React.ReactNode }) {
  return (
    <h1 className="mv-mb-0 mv-text-5xl mv-text-primary mv-font-bold mv-leading-9">
      {props.children}
    </h1>
  );
}

Container.Header = ContainerHeader;
Container.Title = ContainerTitle;

export function Placeholder(props: { children: React.ReactNode }) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child);
    }
  );

  const title = validChildren.find((child) => {
    return (child as React.ReactElement).type === PlaceholderTitle;
  });
  const text = validChildren.find((child) => {
    return (child as React.ReactElement).type === PlaceholderText;
  });
  const button = validChildren.find((child) => {
    return (child as React.ReactElement).type === Button;
  });

  return (
    <div className="mv-relative mv-flex mv-flex-col mv-gap-6 mv-h-[320px] mv-p-6 mv-border mv-border-secondary-50 mv-rounded-2xl mv-bg-secondary-50 mv-justify-center mv-overflow-hidden">
      <div className="mv-absolute mv-text-secondary-300 mv--bottom-8 @md:mv-bottom-0 mv--left-16 @md:mv-left-0">
        <svg
          width="288"
          height="172"
          viewBox="0 0 288 172"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M237.891 270.146C225.407 316.735 209.62 328.325 188.623 346.218C167.627 364.111 135.764 364.881 119.373 363.497C96.9684 361.606 45.622 341.543 26.0662 334.992C-8.9733 323.253 -93.3778 276.911 -79.3246 179.84C-58.611 36.7631 75.1117 24.4223 109.818 39.5964C151.59 57.8597 143.924 79.304 165.974 102.249C189.355 126.578 222.124 131.668 236.824 153.543C256.564 182.918 250.374 223.557 237.891 270.146Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="mv-absolute mv-text-primary-600 mv--bottom-8 @md:mv-bottom-0 mv--left-16 @md:mv-left-0">
        <svg
          width="306"
          height="104"
          viewBox="0 0 306 104"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M304.876 181.101C304.765 226.695 293.15 241.112 278.304 262.55C263.458 283.989 234.531 292.417 219.22 295.126C198.291 298.83 146.514 292.947 127.058 291.702C92.197 289.471 3.84401 267.591 -6.8486 175.493C-22.6089 39.7448 96.5788 -3.94874 131.968 1.50174C174.561 8.06181 172.756 29.5135 198.465 45.1319C225.725 61.6928 256.9 58.3992 275.634 74.8225C300.791 96.8764 304.988 135.507 304.876 181.101Z"
            stroke="currentColor"
            strokeWidth="1.0728"
          />
        </svg>
      </div>
      <div className="mv-absolute mv-text-negative-100 mv--top-16 @md:mv-top-0 mv--right-20 @md:mv-right-0">
        <svg
          width="239"
          height="195"
          viewBox="0 0 239 195"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.788445 -6.06951C0.912543 -56.8526 13.8496 -72.9101 30.3856 -96.7889C46.9215 -120.668 79.1399 -130.055 96.194 -133.073C119.505 -137.198 177.176 -130.645 198.846 -129.258C237.674 -126.773 336.084 -102.403 347.993 0.177393C365.547 151.376 232.794 200.042 193.377 193.972C145.936 186.665 147.947 162.772 119.311 145.375C88.9482 126.93 54.2253 130.598 33.359 112.306C5.33892 87.7416 0.664347 44.7136 0.788445 -6.06951Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="mv-absolute mv-text-negative-500 mv--top-16 @md:mv-top-0 mv--right-20 @md:mv-right-0">
        <svg
          width="191"
          height="189"
          viewBox="0 0 191 189"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.40783 -12.1266C1.53193 -62.9098 14.469 -78.9673 31.0049 -102.846C47.5409 -126.725 79.7593 -136.112 96.8133 -139.13C120.124 -143.255 177.795 -136.702 199.466 -135.315C238.294 -132.831 336.703 -108.46 348.613 -5.87974C366.167 145.319 233.413 193.985 193.996 187.914C146.555 180.608 148.566 156.714 119.931 139.318C89.5676 120.873 54.8447 124.541 33.9784 106.248C5.9583 81.6844 1.28373 38.6565 1.40783 -12.1266Z"
            stroke="currentColor"
            strokeWidth="1.1949"
          />
        </svg>
      </div>
      <div className="mv-flex mv-flex-col mv-gap-2 mv-z-10">
        {title}
        {text}
      </div>
      <div className="mv-text-center mv-z-10">{button}</div>
    </div>
  );
}

function PlaceholderTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className="mv-text-xl mv-text-neutral-700 mv-font-bold mv-leading-6 mv-text-center mv-mb-0">
      {props.children}
    </h2>
  );
}

function PlaceholderText(props: { children: React.ReactNode }) {
  return (
    <p className="mv-text-lg mv-text-neutral-700 mv-font-normal mv-text-center">
      {props.children}
    </p>
  );
}

Placeholder.Title = PlaceholderTitle;
Placeholder.Text = PlaceholderText;

type ButtonProps = PropsWithChildren<{
  children: React.ReactNode;
  style?: "primary" | "secondary";
}>;

export function Button(props: ButtonProps) {
  const { style = "primary" } = props;

  const classes = classNames(
    "mv-font-semibold",
    "mv-inline-flex mv-rounded-lg mv-shrink-0 mv-cursor-pointer mv-user-select-none mv-flex-wrap mv-align-center mv-justify-center mv-px-4 mv-text-sm mv-text-center mv-leading-5",
    "mv-whitespace-nowrap",
    "mv-h-10 mv-text-sm mv-px-6 mv-py-2.5 mv-border",
    style === "primary" &&
      "mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-border-transparent",
    style === "secondary" &&
      "mv-bg-neutral-50 mv-text-primary hover:mv-bg-primary-50 focus:mv-bg-primary-100 active:mv-bg-primary-100 mv-border-primary",
    "mv-gap-2"
  );

  if (React.isValidElement(props.children)) {
    return React.cloneElement(props.children as React.ReactElement, {
      className: classes,
    });
  }

  return <button className={classes}>{props.children}</button>;
}

export function AddIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 5C10.1658 5 10.3247 5.06585 10.4419 5.18306C10.5592 5.30027 10.625 5.45924 10.625 5.625V9.375H14.375C14.5408 9.375 14.6997 9.44085 14.8169 9.55806C14.9342 9.67527 15 9.83424 15 10C15 10.1658 14.9342 10.3247 14.8169 10.4419C14.6997 10.5592 14.5408 10.625 14.375 10.625H10.625V14.375C10.625 14.5408 10.5592 14.6997 10.4419 14.8169C10.3247 14.9342 10.1658 15 10 15C9.83424 15 9.67527 14.9342 9.55806 14.8169C9.44085 14.6997 9.375 14.5408 9.375 14.375V10.625H5.625C5.45924 10.625 5.30027 10.5592 5.18306 10.4419C5.06585 10.3247 5 10.1658 5 10C5 9.83424 5.06585 9.67527 5.18306 9.55806C5.30027 9.44085 5.45924 9.375 5.625 9.375H9.375V5.625C9.375 5.45924 9.44085 5.30027 9.55806 5.18306C9.67527 5.06585 9.83424 5 10 5Z"
        fill="currentColor"
      />
    </svg>
  );
}
