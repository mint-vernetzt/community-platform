import { render } from "@testing-library/react";
import Input from "./Input";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const { baseElement } = render(<Input label="some-label" />);
  expect(baseElement).toBeTruthy();
});
