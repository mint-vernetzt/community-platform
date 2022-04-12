import { render } from "@testing-library/react";
import NewPassword from "./NewPassword";

test("render component", () => {
  const { baseElement } = render(<NewPassword />);
  expect(baseElement).toBeTruthy();
});
