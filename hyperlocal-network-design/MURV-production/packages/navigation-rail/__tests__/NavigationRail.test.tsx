import React from "react";
import "@testing-library/jest-dom";
import { render } from "test-utils";
import { Home, ShoppingCart } from "@murv/icons";
import { NavigationRail, NavigationRailItem } from "../src";
import { ORIENTATION } from "../src/constants";

describe("Navigation Rail Component", () => {
  const defaultProps = {
    dataTestId: "nav",
    topNavigation: [<NavigationRailItem label="Home" />, <NavigationRailItem label="Promotions" />],
    maxTopNavItemCount: 2,
  };

  it("renders with default props", () => {
    const { getByText } = render(<NavigationRail {...defaultProps} />);
    expect(getByText("Home")).toBeInTheDocument();
  });
});

describe("Navigation Rail Component with icons", () => {
  const defaultProps = {
    dataTestId: "nav",
    topNavigation: [
      <NavigationRailItem label="Home" icon={<Home size="24px" className="murv-icons" />} />,
      <NavigationRailItem
        label="Promotions"
        icon={<ShoppingCart size="24px" className="murv-icons" />}
      />,
    ],
    maxTopNavItemCount: 2,
  };

  it("renders with icons as props", () => {
    const { getAllByRole } = render(<NavigationRail {...defaultProps} />);
    // Find the svg by its role
    const images = getAllByRole("img");
    const firstImage = images[0];
    expect(firstImage).toBeInTheDocument();
  });
});

describe("Navigation Rail Component with More Option", () => {
  const defaultProps = {
    dataTestId: "nav",
    topNavigation: [
      <NavigationRailItem label="Home" icon={<Home size="24px" className="murv-icons" />} />,
      <NavigationRailItem label="Listings" icon={<Home size="24px" className="murv-icons" />} />,
      <NavigationRailItem label="Payments" icon={<Home size="24px" className="murv-icons" />} />,
      <NavigationRailItem label="Orders" icon={<Home size="24px" className="murv-icons" />} />,
      <NavigationRailItem label="Promotions" icon={<Home size="24px" className="murv-icons" />} />,
      <NavigationRailItem label="Pricing" icon={<Home size="24px" className="murv-icons" />} />,
      <NavigationRailItem label="Report" icon={<Home size="24px" className="murv-icons" />} />,
      <NavigationRailItem
        label="Growth"
        icon={<ShoppingCart size="24px" className="murv-icons" />}
      />,
    ],
    maxTopNavItemCount: 4,
  };

  it("renders navigation rail with more option", () => {
    const { getAllByText } = render(<NavigationRail {...defaultProps} />);
    expect(getAllByText("More").length).toBe(2);
  });
});

describe("Navigation Rail Horizontal Component", () => {
  const defaultProps = {
    dataTestId: "navigation-rail-horizontal",
    topNavigation: [<NavigationRailItem label="Home" />, <NavigationRailItem label="Promotions" />],
    maxTopNavItemCount: 2,
    orientation: ORIENTATION.HORIZONTAL,
  };

  it("renders with navigation rail horizontally ", () => {
    const { getByTestId } = render(<NavigationRail {...defaultProps} />);
    const element = getByTestId("navigation-rail-horizontal");
    expect(element.getAttribute("orientation")).toBe("horizontal");
  });
});

describe("Navigation Rail Component Snapshots", () => {
  const iconProps = {
    dataTestId: "nav",
    topNavigation: [
      // @ts-ignore
      <NavigationRailItem icon={<Home size="24px" className="murv-icons" />} />,
      // @ts-ignore
      <NavigationRailItem icon={<ShoppingCart size="24px" className="murv-icons" />} />,
    ],
    maxTopNavItemCount: 4,
  };

  const iconLabelProps = {
    dataTestId: "nav",
    topNavigation: [
      <NavigationRailItem label="Report" icon={<Home size="24px" className="murv-icons" />} />,
      <NavigationRailItem
        label="Growth"
        icon={<ShoppingCart size="24px" className="murv-icons" />}
      />,
    ],
    maxTopNavItemCount: 4,
  };

  const orientationProps = {
    dataTestId: "nav",
    topNavigation: [
      <NavigationRailItem label="Report" icon={<Home size="24px" className="murv-icons" />} />,
      <NavigationRailItem
        label="Growth"
        icon={<ShoppingCart size="24px" className="murv-icons" />}
      />,
    ],
    maxTopNavItemCount: 4,
    orientation: ORIENTATION.HORIZONTAL,
  };
  it("matches snapshot with icon props", () => {
    const { asFragment } = render(<NavigationRail {...iconProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with icon props", () => {
    const { asFragment } = render(<NavigationRail {...iconLabelProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with orientation horizontal", () => {
    const { asFragment } = render(<NavigationRail {...orientationProps} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
