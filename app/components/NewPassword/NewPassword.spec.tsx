import { render } from "@testing-library/react";
import NewPassword from "./NewPassword";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const { baseElement } = render(<NewPassword />);
  expect(baseElement).toBeTruthy();
});
