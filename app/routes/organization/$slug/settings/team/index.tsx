import { LoaderFunction } from "remix";
import Add from "./add";

export const loader: LoaderFunction = async (args) => {
  console.log("index loading");
  return null;
};

function Index() {
  return (
    <>
      <h1>Index</h1>
      <Add />
    </>
  );
}

export default Index;
