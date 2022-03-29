import { render } from "@testing-library/react";
import LoginPage from "./LoginPage";

test("render component", () => {
  const { baseElement } = render(<LoginPage />);
  expect(baseElement).toBeTruthy();
});
