import { render } from "@testing-library/react";
import InputPassword from "./InputPassword";

test("render component", () => {
  const { baseElement } = render(<InputPassword label="some-label" />);
  expect(baseElement).toBeTruthy();
});
