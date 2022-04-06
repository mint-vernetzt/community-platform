import { render } from "@testing-library/react";
import HeaderLogo from "./HeaderLogo";

test("render component", () => {
  const { baseElement } = render(<HeaderLogo />);
  expect(baseElement).toBeTruthy();
});
