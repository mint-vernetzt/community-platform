import { Link, NavLink, Outlet } from "remix";

function Explore() {
  const getClassName = (active: boolean) =>
    `block text-3xl ${
      active ? "text-primary" : "text-neutral-500"
    }  hover:text-primary py-3`;
  return (
    <div className="container relative pb-44">
      <div className="flex flex-col lg:flex-row -mx-4 pt-10 lg:pt-0">
        <ul>
          <li>
            <Link to="./profiles">Profiles</Link>
          </li>
          <li>
            <Link to="./organizations">Organizations</Link>
          </li>
        </ul>
      </div>
      <div className="basis-6/12 px-4">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Explore;
