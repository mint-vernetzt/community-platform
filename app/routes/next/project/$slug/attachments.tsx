import { useParams } from "@remix-run/react";

function Attachments() {
  const params = useParams();

  return <h1>/next/project/{params.slug}/attachments</h1>;
}

export default Attachments;
