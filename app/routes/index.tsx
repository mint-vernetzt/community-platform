import { Form, LoaderFunction, Session, useLoaderData } from "remix";
import { supabaseStrategy } from "../auth.server";

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const session = await supabaseStrategy.checkSession(request);
  return { session };
};

export default function Index() {
  const loaderData = useLoaderData<{ session: Session | null }>();

  return (
    <div>
      {loaderData.session !== null ? (
        <Form action="/logout?index" method="post">
          <button type="submit" className="button">
            Logout
          </button>
        </Form>
      ) : null}
      <h1>Welcome to Remix Test2</h1>
      <ul>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/blog"
            rel="noreferrer"
            className="link link-primary"
          >
            15m Quickstart Blog Tutorial
          </a>
        </li>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/jokes"
            rel="noreferrer"
            className="link link-primary"
          >
            Deep Dive Jokes App Tutorial
          </a>
        </li>
        <li>
          <a
            target="_blank"
            href="https://remix.run/docs"
            rel="noreferrer"
            className="link link-primary"
          >
            Remix Docs
          </a>
        </li>
      </ul>
    </div>
  );
}
