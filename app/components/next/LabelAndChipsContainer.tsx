// Design:
// Name: Label & Chips
// TODO: No single source available anymore (Message: Component was removed from library)
// Usage https://www.figma.com/design/3VOaZGZRxO5PkehJv13mfH/Event-Detailseite?node-id=2-7053&m=dev
function LabelAndChipsContainer(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-2">{children}</div>
  );
}

export default LabelAndChipsContainer;
