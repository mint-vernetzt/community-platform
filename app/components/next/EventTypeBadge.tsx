// Design:
// Name: Badge Art des Events
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10730-9774&t=wAvZwxZAKqIdmpiM-4
function EventTypeBadge(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <div className="w-fit p-1.5 bg-secondary-100 rounded-sm text-secondary-700 font-semibold leading-4 text-xs">
      {children}
    </div>
  );
}

export default EventTypeBadge;
