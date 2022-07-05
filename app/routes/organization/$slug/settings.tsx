import { Link, Outlet } from "remix";

function Index() {
  return (
    <>
      <menu>
        <ul>
          <li>
            <Link to="./edit">Edit</Link>
          </li>
          <li>
            <Link to="./team">Team</Link>
          </li>
          <li>
            <Link to="./delete">Delete</Link>
          </li>
        </ul>
      </menu>
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default Index;
