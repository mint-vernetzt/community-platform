import { useParams } from "@remix-run/react";

function About() {
  const params = useParams();

  return <h1>/next/project/{params.slug}/detail/about</h1>;
}

export default About;
