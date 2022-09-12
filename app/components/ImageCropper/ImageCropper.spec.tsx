import { render } from "@testing-library/react";
import ImageCropper from "./ImageCropper";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(<ImageCropper />);
  expect(baseElement).toBeTruthy();
});
