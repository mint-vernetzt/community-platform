import { render } from "@testing-library/react";
import PasswordReset from "./PasswordReset";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const { baseElement } = render(<PasswordReset />);
  expect(baseElement).toBeTruthy();
});
