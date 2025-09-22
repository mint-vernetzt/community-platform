import type React from "react";
import { Section } from "./MyEventsProjectsSection";

export function Container(props: {
  children: React.ReactNode;
  outerContainerClassName?: Pick<
    React.HTMLProps<HTMLDivElement>,
    "className"
  >["className"];
  innerContainerClassName?: Pick<
    React.HTMLProps<HTMLDivElement>,
    "className"
  >["className"];
}) {
  const { outerContainerClassName, innerContainerClassName } = props;
  return (
    <div
      className={`${
        outerContainerClassName !== undefined
          ? outerContainerClassName
          : "w-full h-full flex justify-center"
      }`}
    >
      <div
        className={`${
          innerContainerClassName !== undefined
            ? innerContainerClassName
            : "w-full py-6 px-4 @lg:py-8 @md:px-6 @lg:px-8 flex flex-col gap-6 mb-10 @sm:mb-[72px] @lg:mb-16 max-w-screen-2xl"
        }`}
      >
        {props.children}
      </div>
    </div>
  );
}

function ContainerHeader(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col @sm:flex-row gap-4 @md:gap-6 @lg:gap-8 items-center justify-between">
      {props.children}
    </div>
  );
}

function ContainerTitle(props: { children: React.ReactNode }) {
  return (
    <h1 className="mb-0 text-5xl text-primary font-bold leading-9">
      {props.children}
    </h1>
  );
}

Container.Header = ContainerHeader;
Container.Title = ContainerTitle;
Container.Section = Section;
