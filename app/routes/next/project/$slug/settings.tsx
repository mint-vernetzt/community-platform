import { NavLink, Outlet } from "@remix-run/react";

function ProjectSettings() {
  return (
    <>
      <h1>Project Settings</h1>
      <div className="mv-flex mv-gap-4">
        <NavLink
          to="./general"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          General
        </NavLink>
        <NavLink
          to="./web-social"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Web/Social
        </NavLink>
        <NavLink
          to="./details"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Details
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
          to="./responsible-orgs"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Responsible Organizations
        </NavLink>
        <NavLink
          to="./team"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Team
        </NavLink>
        <NavLink
          to="./attachments"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Attachments
        </NavLink>
        <NavLink
          to="./danger-zone"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Danger Zone
        </NavLink>
      </div>
      <Outlet />
    </>
  );
}

export default ProjectSettings;
