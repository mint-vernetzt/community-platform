import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";

export function BackButton(props: { to: string; children: React.ReactNode }) {
  const { to, children } = props;

  return (
    <TextButton as="link" to={to} arrowLeft variant="dark" weight="base">
      {children}
    </TextButton>
  );
}
