import React from "react";
import { render } from "test-utils";
import { Divider } from "../src/Divider";

describe("Divider", () => {
  test("Renders Divider", () => {
    render(<Divider direction="vertical" />);
  });
});
