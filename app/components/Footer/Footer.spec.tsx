import { render } from "@testing-library/react";
import Footer from "./Footer";

// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

test("render component", () => {
  const { baseElement } = render(
    <Footer isDifferentFooterRoute={false} isNonAppBaseRoute={false} />
  );
  expect(baseElement).toBeTruthy();
});
