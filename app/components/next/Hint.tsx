function Hint(props: { children: React.ReactNode }) {
  return (
    <p className="p-4 rounded-lg bg-primary-50 text-neutral-600">
      {props.children}
    </p>
  );
}

export default Hint;
