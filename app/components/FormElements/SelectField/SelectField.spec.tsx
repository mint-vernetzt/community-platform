import { render } from "@testing-library/react";
import SelectField from "./SelectField";

test("render component", () => {
  const { baseElement } = render(<SelectField />);
  expect(baseElement).toBeTruthy();
});
