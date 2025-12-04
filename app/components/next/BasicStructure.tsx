// Design:
// Name: Grundstruktur_Gap_32px and Grundstruktur_Gap_24px

import classNames from "classnames";

// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10015-37242&m=dev
function BasicStructure(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col p-4 xl:p-8 gap-8 xl:gap-6 bg-white xl:bg-transparent w-full min-h-screen max-w-2xl mx-auto">
      {props.children}
    </div>
  );
}

// Design:
// Name: Container
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10086-2824&t=x9uknsZpVIDwYqGv-4
// TODO: 2 different Containers defined in source
// TODO: No mobile and tablet size defined for the first Container in source
// TODO: No tablet and desktop size defined for the second Container in source
// TODO: Another different container in following usage: https://www.figma.com/design/9aKvb1kUWVYaLDi4xjRaSB/Event-Settings?node-id=67-11724&m=dev
// Therefore added deflatedUntil and gaps prop
function Container(props: {
  children: React.ReactNode;
  deflatedUntil?: "md" | "lg" | "xl";
  gaps?: {
    base: "gap-8" | "gap-4";
    md: "gap-6" | "gap-4";
    xl: "gap-6" | "gap-4";
  };
}) {
  const {
    children,
    deflatedUntil = "md",
    gaps = { base: "gap-8", md: "gap-6", xl: "gap-6" },
  } = props;

  const classes = classNames(
    "w-full flex flex-col bg-white ring-neutral-200 rounded-2xl",
    deflatedUntil === "md" ? "md:p-6 md:ring" : "",
    deflatedUntil === "lg" ? "lg:p-6 lg:ring" : "",
    deflatedUntil === "xl" ? "xl:p-6 xl:ring" : "",
    gaps.base === "gap-4" ? "gap-4" : "",
    gaps.base === "gap-8" ? "gap-8" : "",
    gaps.md === "gap-4" ? "md:gap-4" : "",
    gaps.md === "gap-6" ? "md:gap-6" : "",
    gaps.xl === "gap-4" ? "xl:gap-4" : "",
    gaps.xl === "gap-6" ? "xl:gap-6" : ""
  );

  return <div className={classes}>{children}</div>;
}

BasicStructure.Container = Container;
export default BasicStructure;
