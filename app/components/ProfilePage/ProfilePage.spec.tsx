import { render } from "@testing-library/react";
import ProfilePage from "./ProfilePage";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;

test("render component", () => {
  const { baseElement } = render(<ProfilePage />);
  expect(baseElement).toBeTruthy();
});
