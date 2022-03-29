import { render } from "@testing-library/react";
import PageBackground from "./PageBackground";

test("render component", () => {
  const { baseElement } = render(<PageBackground />);
  expect(baseElement).toBeTruthy();
});
