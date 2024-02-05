import { render } from "@testing-library/react";

import Chip from "./Chip";

// TODO: fix type issue
// Globals of cypress and jest are conflicting
// @ts-ignore
const expect = global.expect as jest.Expect;

describe("Chip", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<Chip title="Tagtitle" slug="slug" />);
    expect(baseElement).toBeTruthy();

    // TODO
    /**
     * - check props
     * - check clickhandler
     * -- is called when tag is clicked
     * -- recreives slug
     * - check if cursor pointer is set when clickhandler present
     */
  });
});
