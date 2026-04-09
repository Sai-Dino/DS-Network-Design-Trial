import React from "react";
import { render } from "murv/test-utils";
import {
  MetricCardStory,
  MetricCardStoryWithoutTag,
  MultiMetricCardStory,
  ImageCardWithTextStory,
  ImageCardListWithTextStory,
  VerticalImageTextStory,
  NonInteractableCard,
  DisabledCard,
  MetricCardWithInvalidElements,
  MetricCardWithTooltip,
} from "../src/stories";

describe("Card component", () => {
  it("Renders Basic Metric Card", () => {
    const { getByText, getAllByText, getByTestId } = render(<MetricCardStory />);
    expect(getByText(/Title of list/)).toBeInTheDocument();
    expect(getByText(/New/)).toBeInTheDocument();
    expect(getAllByText(/Last Month/)).toHaveLength(1);
    expect(getByTestId("murv-card-header-menu-murv-card")).toBeInTheDocument();
  });
  it("Renders Basic Metric Card without Tag", () => {
    const { getByText, queryByText } = render(<MetricCardStoryWithoutTag />);
    expect(getByText(/Title of list/)).toBeInTheDocument();
    expect(queryByText(/New/)).not.toBeInTheDocument();
  });
  it("Renders Multiple Metric Card ", () => {
    const { getByText, getAllByText } = render(<MultiMetricCardStory />);
    expect(getByText(/Title of list/)).toBeInTheDocument();
    expect(getByText(/New/)).toBeInTheDocument();
    expect(getAllByText(/Last Month/)).toHaveLength(3);
  });
  it("Renders Image and text Card ", () => {
    const { getAllByText } = render(<ImageCardWithTextStory />);
    expect(getAllByText(/Secondary Information/)).toHaveLength(1);
  });
  it("Renders Image and text Card List ", () => {
    const { getByText, getAllByText } = render(<ImageCardListWithTextStory />);
    expect(getByText(/Title of list/)).toBeInTheDocument();
    expect(getByText(/New/)).toBeInTheDocument();
    expect(getAllByText(/Secondary Information/)).toHaveLength(5);
  });
  it("Renders Vertical card  ", () => {
    const { getByText, getAllByText } = render(<VerticalImageTextStory />);
    expect(getByText(/Title of list/)).toBeInTheDocument();
    expect(getByText(/New/)).toBeInTheDocument();
    expect(getAllByText(/Primary Information/)).toHaveLength(1);
  });
  it("Non Interactable Card", () => {
    const { getByText, queryByTestId } = render(<NonInteractableCard />);
    expect(getByText(/Title of list/)).toBeInTheDocument();
    expect(getByText(/New/)).toBeInTheDocument();
    expect(queryByTestId("murv-card-header-menu-murv-card")).not.toBeInTheDocument();
  });
  it("Disabled Card", () => {
    const { getByText, queryByTestId } = render(<DisabledCard />);
    expect(getByText(/Title of list/)).toBeInTheDocument();
    expect(getByText(/New/)).toBeInTheDocument();
    expect(queryByTestId("murv-card-header-menu-murv-card")).not.toBeInTheDocument();
  });
  it("Card with invalid element ", () => {
    const { getByText, queryByText } = render(<MetricCardWithInvalidElements />);
    expect(getByText(/Title of list/)).toBeInTheDocument();
    expect(queryByText(/Some Tag/)).not.toBeInTheDocument();
    expect(queryByText(/Some Icon/)).not.toBeInTheDocument();
    expect(queryByText(/Some Invalid Element/)).not.toBeInTheDocument();
  });
  it("Card with Custom Tooltip", () => {
    const { container, getByText } = render(<MetricCardWithTooltip />);
    expect(getByText(/Title of list/)).toBeInTheDocument();
    expect(container.querySelector(".save-btn")).toBeTruthy();
    expect(container.querySelector(".save-icon")).toBeTruthy();
    expect(container.querySelector(".info-icon")).toBeTruthy();
  });
});
