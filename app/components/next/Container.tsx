function Container(props: { children: React.ReactNode }) {
  return <div className="xl:p-6 bg-white gap-6">{props.children}</div>;
}

export default Container;
