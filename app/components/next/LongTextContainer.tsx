// Design:
// Name: Long Text_Container
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10304-9469&t=k3ckPzZS0pgAOOUz-4
function LongTextContainer(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <p className="text-neutral-700 max-w-[800px] text-lg font-normal leading-normal">
      {children}
    </p>
  );
}

export default LongTextContainer;
