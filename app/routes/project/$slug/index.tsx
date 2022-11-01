import { useParams } from "remix";
import { H1 } from "~/components/Heading/Heading";

function Index() {
  const { slug } = useParams();

  return <H1 like="h0">{slug}</H1>;
}

export default Index;
