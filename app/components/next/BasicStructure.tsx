function BasicStructure(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col p-4 xl:p-8 gap-8 bg-white xl:bg-transparent w-full min-h-full max-w-2xl m-auto">
      {props.children}
    </div>
  );
}

function Container(props: { children: React.ReactNode }) {
  return (
    <div className="xl:p-6 bg-white xl:border border-neutral-200 rounded-2xl">
      {props.children}
    </div>
  );
}

BasicStructure.Container = Container;
export default BasicStructure;
