import { render } from "@testing-library/react";
import PasswordReset from "./PasswordReset";

test("render component", () => {
  const { baseElement } = render(<PasswordReset />);
  expect(baseElement).toBeTruthy();
});
