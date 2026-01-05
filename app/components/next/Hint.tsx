// Design
// Name: Hinweis
// Source: https://www.figma.com/design/9aKvb1kUWVYaLDi4xjRaSB/Event-Settings?node-id=288-7794&m=dev
// TODO: No component only frame

function Hint(props: { children: React.ReactNode }) {
  return (
    <p className="p-4 rounded-lg bg-primary-50 text-neutral-600">
      {props.children}
    </p>
  );
}

export default Hint;
