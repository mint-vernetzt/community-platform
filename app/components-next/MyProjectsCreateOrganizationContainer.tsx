export function Container(props: { children: React.ReactNode }) {
  return (
    <div className="mv-w-full mv-h-full mv-flex mv-justify-center mv-pb-8">
      <div className="mv-w-full mv-py-6 mv-px-4 @lg:mv-py-8 @md:mv-px-6 @lg:mv-px-8 mv-flex mv-flex-col mv-gap-6 mv-mb-10 @sm:mv-mb-[72px] @lg:mv-mb-16 mv-max-w-screen-2xl">
        {props.children}
      </div>
    </div>
  );
}

function ContainerHeader(props: { children: React.ReactNode }) {
  return (
    <div className="mv-flex mv-flex-col @sm:mv-flex-row mv-gap-4 @md:mv-gap-6 @lg:mv-gap-8 mv-items-center mv-justify-between">
      {props.children}
    </div>
  );
}

function ContainerTitle(props: { children: React.ReactNode }) {
  return (
    <h1 className="mv-mb-0 mv-text-5xl mv-text-primary mv-font-bold mv-leading-9">
      {props.children}
    </h1>
  );
}

Container.Header = ContainerHeader;
Container.Title = ContainerTitle;
