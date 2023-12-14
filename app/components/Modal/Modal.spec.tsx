import { render } from "@testing-library/react";
import Modal from "./Modal";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(<Modal id="some-id" children={undefined} />);
  expect(baseElement).toBeTruthy();
});
