import { Icon, IconType } from "./Icon";
import { render } from "@testing-library/react";

// TODO: write reasonable tests

describe("Icon", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<Icon type={IconType.Telephone} />);
    expect(baseElement).toBeTruthy();
  });
});
