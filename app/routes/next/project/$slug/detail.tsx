import { TabBar } from "@mint-vernetzt/components";
import { Link, NavLink, Outlet, useMatches } from "@remix-run/react";

function ProjectDetail() {
  const matches = useMatches();
  let pathname = "";

  const lastMatch = matches[matches.length - 1];

  if (typeof lastMatch.pathname !== "undefined") {
    pathname = lastMatch.pathname;
  }

  return (
    <>
      <h1>Project Detail</h1>
      <TabBar>
        <TabBar.Item active={pathname.endsWith("/about")}>
          <NavLink to="./about">about</NavLink>
        </TabBar.Item>
        <TabBar.Item active={pathname.endsWith("/requirements")}>
          <NavLink to="./requirements">requirements</NavLink>
        </TabBar.Item>
        <TabBar.Item active={pathname.endsWith("/attachments")}>
          <NavLink to="./attachments">attachments</NavLink>
        </TabBar.Item>
      </TabBar>
      <Link to="./../settings">⚙️</Link>
      <Outlet />
    </>
  );
}

export default ProjectDetail;
