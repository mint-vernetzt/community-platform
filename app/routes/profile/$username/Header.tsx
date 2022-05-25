import * as React from "react";
import { Link, Form } from "remix";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";

export interface HeaderProps {
  username: string;
  initials: string;
}

export default function Header({ username, initials }: HeaderProps) {
  return (
    <header className="shadow-md mb-8">
      <div className="container mx-auto px-4 relative z-11">
        <div className="basis-full md:basis-6/12 px-4 pt-3 pb-3 flex flex-row items-center">
          <div>
            <Link to="/explore">
              <HeaderLogo />
            </Link>
          </div>

          <div className="ml-auto">
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-primary w-10 h-10">
                {initials}
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link to={`/profile/${username}`}>Profil anzeigen</Link>
                </li>
                <li>
                  <Link to={`/profile/${username}/edit`}>
                    Profil bearbeiten
                  </Link>
                </li>
                <li>
                  <Form action="/logout?index" method="post">
                    <button type="submit" className="w-full text-left">
                      Logout
                    </button>
                  </Form>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
