import { ActionFunction, Form, json, LoaderFunction } from "remix";
import {
  authenticator,
  sessionStorage,
  supabaseStrategy,
} from "../../auth.server";

export const Routes = {
  SuccessRedirect: "/",
  FailureRedirect: "/login",
};

type LoaderData = {
  error: Error | null;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;

  await supabaseStrategy.checkSession(request, {
    successRedirect: "/",
  });

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const error = session.get(authenticator.sessionErrorKey);

  return json<LoaderData>({ error });
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  await authenticator.authenticate("sb", request, {
    successRedirect: Routes.SuccessRedirect,
    failureRedirect: Routes.FailureRedirect,
  });
};

export default function Index() {
  return (
    <Form method="post">
      <label htmlFor="email">E-Mail</label>
      <input type="email" id="email" name="email" required />
      <label htmlFor="password">Password</label>
      <input type="password" id="password" name="password" required />
      <button type="submit">Submit</button>
    </Form>
  );
}
