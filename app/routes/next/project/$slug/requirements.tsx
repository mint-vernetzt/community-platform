import { useParams } from "@remix-run/react";

function Requirements() {
  const params = useParams();

  return <h1>/next/project/{params.slug}/requirements</h1>;
}

export default Requirements;
