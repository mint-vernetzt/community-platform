// Design:
// Name: Chip Medium
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=5679-78729&m=dev
function ChipMedium(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <li className="bg-primary-50 rounded-lg px-3 py-1.5 text-primary-600 text-sm font-semibold leading-5">
      {children}
    </li>
  );
}

export default ChipMedium;
