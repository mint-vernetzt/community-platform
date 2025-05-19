import { Link } from "react-router";

function LinkButton(props: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={props.to}
      className="mv-appearance-none mv-font-semibold mv-text-center mv-rounded-lg mv-h-10 mv-text-sm mv-px-4 mv-py-2.5 mv-leading-5 mv-border mv-bg-neutral-50 mv-border-primary mv-text-primary hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
    >
      {props.children}
    </Link>
  );
}

export { LinkButton };
