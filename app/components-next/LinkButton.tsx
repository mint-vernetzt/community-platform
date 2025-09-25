import { Link, type LinkProps } from "react-router";

function LinkButton(props: {
  to: string;
  children: React.ReactNode;
  prefetch?: LinkProps["prefetch"];
}) {
  return (
    <Link
      to={props.to}
      className="appearance-none font-semibold text-center rounded-lg h-10 text-sm px-4 py-2.5 leading-5 border bg-neutral-50 border-primary text-primary hover:bg-primary-50 focus:bg-primary-50 active:bg-primary-100"
      prefetch={props.prefetch}
    >
      {props.children}
    </Link>
  );
}

export { LinkButton };
