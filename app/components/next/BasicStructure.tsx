// Design:
// Name: Grundstruktur_Gap_32px and Grundstruktur_Gap_24px
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10015-37242&m=dev
function BasicStructure(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col p-4 xl:p-8 gap-8 bg-white xl:bg-transparent w-full min-h-full max-w-2xl m-auto">
      {props.children}
    </div>
  );
}

// Design:
// Name: Container
// Source: TODO: No single source available yet
// Example Usage: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10907-15341&m=dev
function Container(props: { children: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col gap-8 md:gap-6 md:p-6 bg-white md:ring ring-neutral-200 rounded-2xl">
      {props.children}
    </div>
  );
}

BasicStructure.Container = Container;
export default BasicStructure;
