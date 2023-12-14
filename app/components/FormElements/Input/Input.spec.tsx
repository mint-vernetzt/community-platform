import { render } from "@testing-library/react";
import Input from "./Input";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(<Input label="some-label" />);
  expect(baseElement).toBeTruthy();
});
