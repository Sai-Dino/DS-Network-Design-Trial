import React from "react";
import "@testing-library/jest-dom";
import { render } from "test-utils";
import { ButtonProps } from "@murv/button";
import { ButtonGroupProps } from "@murv/button-group";
import { ExpandMore } from "@murv/icons";
import { PageHeader } from "../src";

describe("PageHeader component testing", () => {
  it("PageHeader with required props", () => {
    const mockBreadCrumbProps = {
      routes: [
        { caption: "Home", url: "/" },
        { caption: "Link", url: "/" },
        { caption: "Link", url: "/" },
      ],
    };
    const { container } = render(
      <PageHeader pageHeaderText="test" breadcrumbProps={mockBreadCrumbProps} />,
    );
    expect(container).toMatchSnapshot();
  });

  it("PageHeader with all props", () => {
    const mockBreadCrumbProps = {
      routes: [
        { caption: "Home", url: "/" },
        { caption: "Link", url: "/" },
        { caption: "Link", url: "/" },
      ],
    };
    const mockTagProps = [{ tagText: "Label 1" }, { tagText: "Label 2" }, { tagText: "Label 3" }];
    const mockButtonGroupProps: ButtonGroupProps = {
      buttons: [
        { buttonType: "tertiary", children: "Tertiary", onClick: () => {} },
        { buttonType: "secondary", children: "Secondary", onClick: () => {} },
        { buttonType: "primary", children: "Primary", onClick: () => {} },
        { buttonType: "secondary", children: "More", SuffixIcon: ExpandMore, onClick: () => {} },
      ],
    };
    const mockButtonProps: Partial<ButtonProps> = {
      onClick: () => {},
      buttonType: "secondary",
      className: "temp",
    };
    // TODO: add filterProps later when implemented
    const { container } = render(
      <PageHeader
        pageHeaderText="Page Title"
        breadcrumbProps={mockBreadCrumbProps}
        tags={mockTagProps}
        buttonGroupProps={mockButtonGroupProps}
        buttonProps={mockButtonProps}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
