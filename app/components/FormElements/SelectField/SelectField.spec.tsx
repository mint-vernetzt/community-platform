import { render } from "@testing-library/react";
import SelectField from "./SelectField";

test("render component", () => {
  const { baseElement } = render(<SelectField label="some-label" />);
  expect(baseElement).toBeTruthy();
});
