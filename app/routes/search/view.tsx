import { NavLink, Outlet } from "@remix-run/react";
import { H1 } from "~/components/Heading/Heading";

export default function SearchView() {
  // TODO: Search input via searchParams
  // const [searchParams] = useSearchParams();
  const getClassName = (active: boolean) =>
    `block text-3xl ${
      active
        ? "text-primary border-b-primary"
        : "text-neutral-500 border-transparent"
    }  hover:text-primary py-3 border-y hover:border-b-primary inline-block`;
  return (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Suchergebnisse</H1>
        <p className="">TODO: Search Input</p>
      </section>
      <section className="container my-8 md:my-10 lg:my-20" id="search-results">
        <ul
          className="nav nav-tabs nav-justified flex flex-col md:flex-row flex-wrap list-none border-b-0 pl-0 mb-4"
          id="search-result-tabs"
          role="tablist"
        >
          <li className="nav-item flex-grow text-center" role="presentation">
            <NavLink
              to="profiles"
              className={({ isActive }) => getClassName(isActive)}
            >
              Profile
            </NavLink>
          </li>
          <li className="nav-item flex-grow text-center" role="presentation">
            <NavLink
              to="organizations"
              className={({ isActive }) => getClassName(isActive)}
            >
              Organisationen
            </NavLink>
          </li>
          <li className="nav-item flex-grow text-center" role="presentation">
            <NavLink
              to="events"
              className={({ isActive }) => getClassName(isActive)}
            >
              Veranstaltungen
            </NavLink>
          </li>
          <li className="nav-item flex-grow text-center" role="presentation">
            <NavLink
              to="projects"
              className={({ isActive }) => getClassName(isActive)}
            >
              Projekte
            </NavLink>
          </li>
        </ul>
      </section>
      <Outlet />
    </>
  );
}
