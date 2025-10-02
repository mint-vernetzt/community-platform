function SectionDetailHeader(props: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col border border-neutral-200 rounded-2xl bg-white overflow-hidden">
      {props.children}
    </section>
  );
}

function SectionDetailHeaderContent(props: { children: React.ReactNode }) {
  return <div className="px-4 py-6 xl:px-6 md:gap-6">{props.children}</div>;
}

SectionDetailHeader.Content = SectionDetailHeaderContent;

export default SectionDetailHeader;
