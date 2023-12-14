import { render } from "@testing-library/react";
import Footer from "./Footer";

/** @type {jest.Expect} */
// @ts-ignore
const expect = global.expect;
test("render component", () => {
  const { baseElement } = render(
    <Footer isDifferentFooterRoute={false} isNonAppBaseRoute={false} />
  );
  expect(baseElement).toBeTruthy();
});
