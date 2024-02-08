import { Form } from "@remix-run/react";
import { invariantResponse } from "~/lib/utils/response";

export const loader = async () => {
  //   invariantResponse(false, "Loader test error", { status: 500 });
  return null;
};

export const action = async () => {
  invariantResponse(false, "Action test error", { status: 500 });
  return null;
};

function ErrorPage() {
  // throw new Error("Client test error");

  return (
    <Form method="post">
      <button type="submit">Click me for action error</button>
    </Form>
  );
}

export default ErrorPage;
