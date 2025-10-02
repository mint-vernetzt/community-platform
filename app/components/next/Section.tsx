function Section(props: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col border border-neutral-200 rounded-2xl bg-white">
      {props.children}
    </section>
  );
}

export default Section;
