import { render } from "@testing-library/react";
import SelectAdd from "./SelectAdd";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(<SelectAdd name="test" label={""} />);
  expect(baseElement).toBeTruthy();
});
