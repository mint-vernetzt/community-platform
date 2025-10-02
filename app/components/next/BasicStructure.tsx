function BasicStructure(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col p-4 xl:p-8 gap-8 md:gap-4 xl:gap-8 bg-white xl:bg-transparent w-full max-w-screen-2xl min-h-full">
      {props.children}
    </div>
  );
}

export default BasicStructure;
