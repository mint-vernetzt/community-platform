// Design:
// Name: Headline & Tags
// TODO: No single source available anymore (Message: Component was removed from library)
// Usage example: https://www.figma.com/design/3VOaZGZRxO5PkehJv13mfH/Event-Detailseite?node-id=2-7052&m=dev
function HeadlineAndTagsContainer(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-2">{children}</div>
  );
}

export default HeadlineAndTagsContainer;
