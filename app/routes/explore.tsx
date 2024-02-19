import { Outlet } from "@remix-run/react";

export const loader = async () => {
  return null;
};

function Explore() {
  return <Outlet />;
}

export default Explore;
