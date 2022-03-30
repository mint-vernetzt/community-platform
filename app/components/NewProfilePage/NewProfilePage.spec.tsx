import { render } from "@testing-library/react";
import NewProfilePage from "./NewProfilePage";

test("render component", () => {
  const { baseElement } = render(<NewProfilePage />);
  expect(baseElement).toBeTruthy();
});
