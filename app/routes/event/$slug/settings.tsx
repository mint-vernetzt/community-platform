import { NavLink } from "remix";

function Settings() {
  const getClassName = (active: boolean) =>
    `block text-3xl ${
      active ? "text-primary" : "text-neutral-500"
    }  hover:text-primary py-3`;
  return (
    <menu>
      <NavLink
        to="general"
        className={({ isActive }) => getClassName(isActive)}
      >
        Allgemein
      </NavLink>
    </menu>
  );
}

export default Settings;
