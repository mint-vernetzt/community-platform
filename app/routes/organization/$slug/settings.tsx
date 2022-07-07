import { GravityType } from "imgproxy/dist/types";
import { Form, Link, LoaderFunction, Outlet, useLoaderData } from "remix";
import HeaderLogo from "~/components/HeaderLogo/HeaderLogo";
import { builder } from "~/imgproxy";
import { getInitials } from "~/lib/profile/getInitials";
import { getProfileByUserId } from "~/profile.server";
import { supabaseAdmin } from "~/supabase";
import { handleAuthorization } from "./settings/utils.server";

type LoaderData = {
  username: string;
  initials: string;
  images: {
    avatar?: string;
  };
};

export const loader: LoaderFunction = async (args) => {
  const { currentUser } = await handleAuthorization(args);
  const profile = await getProfileByUserId(currentUser.id);

  const images: { avatar?: string } = {};

  if (profile.avatar) {
    const { publicURL } = supabaseAdmin.storage // TODO: don't use admin (supabaseClient.setAuth)
      .from("images")
      .getPublicUrl(profile.avatar);
    if (publicURL) {
      images.avatar = builder
        .resize("fill", 144, 144)
        .gravity(GravityType.north_east)
        .dpr(2)
        .generateUrl(publicURL);
    }
  }

  const initials = getInitials(profile);

  return { username: profile.username, images, initials };
};

function Index() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <header className="shadow-md mb-8">
        <div className="container relative z-10">
          <div className="py-3 flex flex-row items-center">
            <div>
              <Link to="/explore">
                <HeaderLogo />
              </Link>
            </div>
            <div className="ml-auto">
              <div className="dropdown dropdown-end">
                {loaderData.images.avatar === undefined ? (
                  <label tabIndex={0} className="btn btn-primary w-10 h-10">
                    {loaderData.initials}
                  </label>
                ) : (
                  <img src={loaderData.images.avatar} alt="" />
                )}
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li>
                    <Link to={`/profile/${loaderData.username}`}>
                      Profil anzeigen
                    </Link>
                  </li>
                  <li>
                    <Link to={`/profile/${loaderData.username}/edit`}>
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
      <menu>
        <ul>
          <li>
            <Link to=".">Edit</Link>
          </li>
          <li>
            <Link to="./team">Team</Link>
          </li>
          <li>
            <Link to="./network">Network</Link>
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
