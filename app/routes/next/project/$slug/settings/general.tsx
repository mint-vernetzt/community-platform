import { useParams } from "@remix-run/react";

function General() {
  const params = useParams();

  return <h1>/next/project/{params.slug}/settings/general</h1>;
}

export default General;
