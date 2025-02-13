import { Outlet } from "react-router";

export const loader = async () => {
  return null;
};

function Explore() {
  return <Outlet />;
}

export default Explore;
