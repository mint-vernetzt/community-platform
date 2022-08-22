import { render } from "@testing-library/react";
import Modal from "./Modal";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(<Modal />);
  expect(baseElement).toBeTruthy();
});
