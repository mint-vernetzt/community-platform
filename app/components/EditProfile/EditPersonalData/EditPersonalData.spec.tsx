import { render } from "@testing-library/react";
import EditPersonalData from "./EditPersonalData";

test("render component", () => {
  const { baseElement } = render(<EditPersonalData />);
  expect(baseElement).toBeTruthy();
});
