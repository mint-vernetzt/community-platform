import { Link, NavLink, Outlet } from "@remix-run/react";

function ProjectDetail() {
  return (
    <>
      <h1>Project Detail</h1>
      <div className="mv-flex mv-gap-4">
        <NavLink
          to="./about"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          About
        </NavLink>
        <NavLink
          to="./requirements"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Requirements
        </NavLink>
        <NavLink
          to="./attachments"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Attachments
        </NavLink>
      </div>
      <Link to="./../settings">⚙️</Link>
      <Outlet />
    </>
  );
}

export default ProjectDetail;
