import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, waitFor } from "murv/test-utils";
import { ButtonGroupProps } from "@murv/button-group";
import { TagProps } from "@murv/tag";
import { Add } from "@murv/icons";
import { Banner } from "../src/index";

const buttonGroupProps: ButtonGroupProps = {
  buttons: [
    {
      buttonType: "inline",
      buttonStyle: "brand",
      PrefixIcon: Add,
      onClick: jest.fn,
    },
    {
      buttonType: "inline",
      buttonStyle: "brand",
      children: "Button",
      onClick: jest.fn,
    },
  ],
  alignment: "right",
  padding: "0px",
};

const tagProps: TagProps = {
  tagText: "Custom Tag",
  alignment: "regular",
  tagStyle: "green",
};

describe("Banner component", () => {
  it("renders correctly with all props", () => {
    const onCloseButtonClick = jest.fn();
    const { container } = render(
      <Banner
        id="banner-1"
        dataTestId="banner-test"
        status="success"
        tagProps={tagProps}
        primaryText="Primary Text"
        secondaryText="Secondary Text"
        tertiaryText="Tertiary Text"
        buttonGroupProps={buttonGroupProps}
        onCloseButtonClick={onCloseButtonClick}
      />,
    );
    expect(container).toMatchSnapshot();
  });
  it("renders correctly without buttonGroupProps and tag props", () => {
    const onCloseButtonClick = jest.fn();
    const { container } = render(
      <Banner
        id="banner-2"
        dataTestId="banner-test"
        status="success"
        primaryText="Primary Text"
        secondaryText="Secondary Text"
        tertiaryText="Tertiary Text"
        onCloseButtonClick={onCloseButtonClick}
      />,
    );
    expect(container).toMatchSnapshot();
  });
  it("renders correctly without onCloseButtonClick, ButtonGroup, Tag props", () => {
    const { container } = render(
      <Banner
        id="banner-3"
        dataTestId="banner-test"
        status="success"
        primaryText="Primary Text"
        secondaryText="Secondary Text"
        tertiaryText="Tertiary Text"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it("renders correctly without major optional props", () => {
    const { container } = render(
      <Banner id="banner-4" dataTestId="banner-test" status="success" primaryText="Primary Text" />,
    );
    expect(container).toMatchSnapshot();
  });

  it("renders correctly without optional props", () => {
    const { container } = render(<Banner status="success" />);
    expect(container).toMatchSnapshot();
  });

  it("calls onCloseButtonClick when close icon is clicked", async () => {
    const onCloseButtonClick = jest.fn();
    const { getByTestId } = render(
      <Banner
        id="banner-6"
        dataTestId="banner-test"
        status="warning"
        primaryText="Primary Text"
        onCloseButtonClick={onCloseButtonClick}
      />,
    );
    const closeIcon = getByTestId("icon-wrapper");
    fireEvent.click(closeIcon);
    // Wait for the exit animation (300ms) to complete
    await waitFor(() => {
      expect(onCloseButtonClick).toHaveBeenCalled();
    });

    expect(() => getByTestId("banner-6")).toThrow();
  });
});
