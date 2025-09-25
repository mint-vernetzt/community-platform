export function Container(props: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex justify-center pb-8">
      <div className="w-full py-6 px-4 @lg:py-8 @md:px-6 @lg:px-8 flex flex-col gap-6 mb-10 @sm:mb-[72px] @lg:mb-16 max-w-screen-2xl">
        {props.children}
      </div>
    </div>
  );
}

function ContainerHeader(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col @sm:flex-row gap-4 @md:gap-6 @lg:gap-8 items-center justify-between">
      {props.children}
    </div>
  );
}

function ContainerTitle(props: { children: React.ReactNode }) {
  return (
    <h1 className="mb-0 text-5xl text-primary font-bold leading-9">
      {props.children}
    </h1>
  );
}

Container.Header = ContainerHeader;
Container.Title = ContainerTitle;
