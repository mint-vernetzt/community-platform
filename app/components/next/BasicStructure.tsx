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
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10086-2824&t=x9uknsZpVIDwYqGv-4
// TODO: 2 different Containers defined in source
// TODO: No mobile and tablet size defined for the first Container in source
// TODO: No tablet and desktop size defined for the second Container in source
function Container(props: { children: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col gap-8 md:gap-6 md:p-6 bg-white md:ring ring-neutral-200 rounded-2xl">
      {props.children}
    </div>
  );
}

BasicStructure.Container = Container;
export default BasicStructure;
