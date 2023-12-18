import { Icon, IconType } from "./Icon";
import { render } from "@testing-library/react";

// TODO: write reasonable tests
// TODO: fix type issues
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

describe("Icon", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<Icon type={IconType.Telephone} />);
    expect(baseElement).toBeTruthy();
  });
});
