import { LoaderFunction, useParams } from "remix";

export const loader: LoaderFunction = async () => {
  return null;
};

function Index() {
  const params = useParams();
  return <h1>Slug: {params.slug}</h1>;
}

export default Index;
