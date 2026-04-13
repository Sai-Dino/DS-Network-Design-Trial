import React from "react";
import "@testing-library/jest-dom";
// @ts-ignore
import { render } from "murv/test-utils";
import Breadcrumb from "@murv/breadcrumb";

describe("Badge component", () => {
  it("renders with more than 4 routes", () => {
    const routes = [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
      { caption: "Third", url: "https://seller.flipkart.com" },
      { caption: "Fourth", url: "https://seller.flipkart.com" },
      { caption: "Fifth", url: "https://seller.flipkart.com" },
      { caption: "Sixth", url: "https://seller.flipkart.com" },
      { caption: "Last", url: "https://seller.flipkart.com" },
    ];
    const breadcrumbComponent = render(<Breadcrumb routes={routes} />);
    expect(breadcrumbComponent).toMatchSnapshot();
  });

  it("renders with more than 1 route", () => {
    const routes = [{ caption: "First", url: "https://seller.flipkart.com" }];
    const breadcrumbComponent = render(<Breadcrumb routes={routes} />);
    expect(breadcrumbComponent).toMatchSnapshot();
  });

  it("renders with more than 2 routes", () => {
    const routes = [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
    ];
    const breadcrumbComponent = render(<Breadcrumb routes={routes} />);
    expect(breadcrumbComponent).toMatchSnapshot();
  });

  it("renders with more than 4 routes", () => {
    const routes = [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
      { caption: "Third", url: "https://seller.flipkart.com" },
      { caption: "Fourth", url: "https://seller.flipkart.com" },
    ];
    const breadcrumbComponent = render(<Breadcrumb routes={routes} />);
    expect(breadcrumbComponent).toMatchSnapshot();
  });

  // Test case for hiding base icon
  it("renders without base icon when showBaseIcon is false", () => {
    const routes = [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
    ];
    const breadcrumbComponent = render(<Breadcrumb routes={routes} showBaseIcon={false} />);
    expect(breadcrumbComponent).toMatchSnapshot();
  });

  // Test case for last item as span (multiple routes)
  it("renders last item as span in multiple routes", () => {
    const routes = [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
      { caption: "Third", url: "https://seller.flipkart.com" },
    ];
    const breadcrumbComponent = render(<Breadcrumb routes={routes} />);
    expect(breadcrumbComponent).toMatchSnapshot();
  });

  // Test case for long routes with optional icons
  it("renders long routes with optional icons", () => {
    const routes = [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
      { caption: "Third", url: "https://seller.flipkart.com" },
      { caption: "Fourth", url: "https://seller.flipkart.com" },
      { caption: "Fifth", url: "https://seller.flipkart.com" },
      { caption: "Sixth", url: "https://seller.flipkart.com" },
      { caption: "Last", url: "https://seller.flipkart.com" },
    ];
    const breadcrumbComponent = render(
      <Breadcrumb routes={routes} showBaseIcon={false} showSeparatorIcon={false} />,
    );
    expect(breadcrumbComponent).toMatchSnapshot();
  });
});
