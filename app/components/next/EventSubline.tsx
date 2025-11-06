// Design:
// Name: Kurzbeschreibung_Event
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10682-8251&t=slnZHLLTjMRU2Mss-4
function EventSubline(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <h2 className="mb-0 max-w-[800px] text-neutral-700 text-2xl font-semibold leading-7">
      {children}
    </h2>
  );
}

export default EventSubline;
