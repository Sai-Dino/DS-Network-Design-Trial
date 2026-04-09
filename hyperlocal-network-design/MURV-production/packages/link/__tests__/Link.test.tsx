/* eslint-disable jsx-a11y/anchor-is-valid */

import React from "react";
import { render, fireEvent, waitFor } from "test-utils";
import { Link } from "../src/Link";

describe("Link Component Tests", () => {
  test("Renders internal link with text", () => {
    const { getByText, asFragment } = render(
      <Link body="Internal link" linkType="internal" url="https://www.google.com/" />,
    );
    const ele = getByText("Internal link");
    expect(ele).toBeInTheDocument();
    expect(asFragment).toMatchSnapshot();
  });
  test("Renders internal link and click on the link", async () => {
    const mockClickFunction = jest.fn();
    const { getByTestId } = render(
      <Link
        body="Internal link"
        linkType="internal"
        url="https://www.google.com/"
        dataTestId="internal-link-clicked"
        onClick={mockClickFunction}
      />,
    );
    const ele = getByTestId("internal-link-clicked");
    fireEvent.click(ele);
    await waitFor(() => {
      expect(mockClickFunction).toHaveBeenCalledTimes(1);
    });
  });

  //

  test("Renders external link with text", () => {
    const { getByText, asFragment } = render(
      <Link body="External link" linkType="external" url="https://www.google.com/" />,
    );
    const ele = getByText("External link");
    expect(ele).toBeInTheDocument();
    expect(asFragment).toMatchSnapshot();
  });
  test("Renders external link and click on the link", async () => {
    const mockClickFunction = jest.fn();
    const { getByTestId } = render(
      <Link
        body="External link"
        linkType="external"
        url="https://www.google.com/"
        dataTestId="external-link-clicked"
        onClick={mockClickFunction}
      />,
    );
    const ele = getByTestId("external-link-clicked");
    fireEvent.click(ele);
    await waitFor(() => {
      expect(mockClickFunction).toHaveBeenCalledTimes(1);
    });
  });

  //

  test("Renders standalone link with text", () => {
    const { getByText, asFragment } = render(
      <Link body="Standalone link" linkType="standalone" url="https://www.google.com/" />,
    );
    const ele = getByText("Standalone link");
    expect(ele).toBeInTheDocument();
    expect(asFragment).toMatchSnapshot();
  });
  test("Renders standalone link and click on the link", async () => {
    const mockClickFunction = jest.fn();
    const { getByTestId } = render(
      <Link
        body="Standalone link"
        linkType="standalone"
        url="https://www.google.com/"
        dataTestId="standalone-link-clicked"
        onClick={mockClickFunction}
      />,
    );
    const ele = getByTestId("standalone-link-clicked");
    fireEvent.click(ele);
    await waitFor(() => {
      expect(mockClickFunction).toHaveBeenCalledTimes(1);
    });
  });

  //

  test("Renders internal link with disabled state", async () => {
    const mockClickFunction = jest.fn();
    const { getByText, asFragment } = render(
      <Link
        body="Internal link with disabled state"
        isDisabled
        linkType="internal"
        url="https://www.google.com/"
        onClick={mockClickFunction}
      />,
    );
    const ele = getByText("Internal link with disabled state");
    expect(ele).toBeInTheDocument();
    expect(asFragment).toMatchSnapshot();
  });

  //

  test("Renders link with caption text", () => {
    const { getByText, asFragment } = render(
      <Link caption="Caption text" linkType="standalone" url="https://www.google.com/" />,
    );
    const ele = getByText("Caption text");
    expect(ele).toBeInTheDocument();
    expect(asFragment).toMatchSnapshot();
  });
  test("Does not render link as both caption and body are not there", async () => {
    const { container, asFragment } = render(
      <Link linkType="standalone" url="https://www.google.com/" dataTestId="no-caption-body" />,
    );
    await waitFor(() => {
      expect(container.childElementCount).toEqual(0);
    });

    expect(asFragment).toMatchSnapshot();
  });

  //

  //
});
