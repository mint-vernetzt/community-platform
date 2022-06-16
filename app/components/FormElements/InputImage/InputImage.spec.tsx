import { render } from "@testing-library/react";
import InputImage from "./InputImage";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(<InputImage />);
  expect(baseElement).toBeTruthy();
});
