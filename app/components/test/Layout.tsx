import { type ReactNode } from "react";

export type LayoutProps = {
  children: ReactNode;
};

function Layout(props: LayoutProps) {
  return <span className="container">{props.children}</span>;
}

export default Layout;
