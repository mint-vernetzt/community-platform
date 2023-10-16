import { Link, NavLink, Outlet } from "@remix-run/react";
import Header from "~/components/test/Header";
import Status from "~/components/test/Status";
import Image from "~/components/test/Image";

{
  /* <Header>
  <Image />
  <Controls><button>toogle fullscreen</button><button>Edit Background Image</button></Controls>
  <Body>
    <Avatar>
    <Controls></Controls>
    <h1></h1>
    <h2></h2>
  </Body>
  <Footer>
    <Controls></Controls>
  </Footer>
</Header> */
}

function ProjectDetail() {
  return (
    <>
      <Header>
        <Status>Entwurf</Status>
        <Image
          src="/images/default-event-background.jpg"
          alt="Standard Hintergrund"
          blurredSrc="/images/default-event-background-blurred.jpg"
        />
      </Header>
      <div className="mv-flex mv-gap-4">
        <NavLink
          to="./about"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          About
        </NavLink>
        <NavLink
          to="./requirements"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Requirements
        </NavLink>
        <NavLink
          to="./attachments"
          className={({ isActive }) => {
            return isActive ? "mv-underline" : "mv-text-primary";
          }}
        >
          Attachments
        </NavLink>
      </div>
      <Link to="./../settings">⚙️</Link>
      <Outlet />
    </>
  );
}

export default ProjectDetail;
