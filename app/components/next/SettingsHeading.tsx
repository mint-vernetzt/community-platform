// Design:
// Name: Heading_H1 (settings page title)
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10096-9570&m=dev
function SettingsHeading(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <h1 className="w-full mb-0 text-primary text-5xl font-bold leading-9">
      {children}
    </h1>
  );
}

export default SettingsHeading;
