import React from "react";
import "@testing-library/jest-dom";
import { render } from "murv/test-utils";
import { Badge } from "../src";

describe("Badge component", () => {
  // Default State
  it("renders with default props", () => {
    const badgeComponent = render(<Badge />);
    expect(badgeComponent).toMatchSnapshot();
  });

  // Default State with numbers
  it("renders with default props with numbers", () => {
    const badgeComponent = render(<Badge>27</Badge>);
    expect(badgeComponent).toMatchSnapshot();
  });

  // Disabled State
  it("renders with disabled props", () => {
    const badgeComponent = render(<Badge disabled />);
    expect(badgeComponent).toMatchSnapshot();
  });

  // Disabled State with numbers
  it("renders with disabled props with numbers", () => {
    const badgeComponent = render(<Badge disabled>27</Badge>);
    expect(badgeComponent).toMatchSnapshot();
  });

  // Highlight State
  it("renders with Highlight props", () => {
    const badgeComponent = render(<Badge type="highlight" />);
    expect(badgeComponent).toMatchSnapshot();
  });

  // Highlight State with numbers
  it("renders with Highlight props with numbers", () => {
    const badgeComponent = render(<Badge type="highlight">27</Badge>);
    expect(badgeComponent).toMatchSnapshot();
  });

  // Subtle State
  it("renders with Subtle props", () => {
    const badgeComponent = render(<Badge type="subtle" />);
    expect(badgeComponent).toMatchSnapshot();
  });

  // Subtle State with numbers
  it("renders with Subtle props with numbers", () => {
    const badgeComponent = render(<Badge type="subtle">27</Badge>);
    expect(badgeComponent).toMatchSnapshot();
  });

  // Brand State
  it("renders with Brand props", () => {
    const badgeComponent = render(<Badge type="brand" />);
    expect(badgeComponent).toMatchSnapshot();
  });

  // Brand State with numbers
  it("renders with Brand props with numbers", () => {
    const badgeComponent = render(<Badge type="brand">27</Badge>);
    expect(badgeComponent).toMatchSnapshot();
  });

  // With all props
  it("renders with all props", () => {
    const badgeComponent = render(
      <Badge
        type="brand"
        id="notification-badge-all-props"
        dataTestId="notification-badge-all-props"
        title="Order pending notifications"
        disabled
      >
        27
      </Badge>,
    );
    expect(badgeComponent).toMatchSnapshot();
  });
});
