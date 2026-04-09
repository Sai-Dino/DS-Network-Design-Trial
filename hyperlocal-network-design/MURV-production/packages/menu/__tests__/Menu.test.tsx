import React from "react";
import "@testing-library/jest-dom";
import { Save } from "@murv/icons";
import { render, fireEvent } from "murv/test-utils";
import { waitFor } from "@testing-library/react";
import { Menu } from "../src";

const menuItems = [
  {
    label: "Option 1",
    leftIcon: <Save />,
    hasActionables: true,
    onHover: () => {},
    menuItems: [
      {
        label: "Option 1-1",
        leftIcon: <Save />,
        // eslint-disable-next-line
        onClick: () => console.log("Clicked"),
      },
      {
        label: "Option 1-2",
        leftIcon: <Save />,
      },
    ],
  },
  {
    label: "Option 2",
    leftIcon: <Save />,
    menuItems: [
      {
        label: "Option 2-1",
        leftIcon: <Save />,
      },
      {
        label: "Option 2-2",
        leftIcon: <Save />,
      },
    ],
  },
  {
    label: "Option 3",
    leftIcon: <Save />,
  },
];
const testId = "UTC";

describe("Menu component", () => {
  // Default State Testing
  it("should render menu", () => {
    const tree = render(
      <Menu
        title="Main Menu"
        closeOnClickOutside
        popoverAction="click"
        testId={testId}
        popoverPosition="bottom-left"
        menuItems={menuItems}
        renderTarget={(props) => (
          <button {...props} type="button">
            Open Menu
          </button>
        )}
      />,
    );

    const { getByText, getByTestId } = tree;
    const btnElement = getByText("Open Menu");
    expect(btnElement).toBeInTheDocument();
    fireEvent.click(btnElement);
    const mainMenuTitle = getByTestId("menu-header-UTC");
    const optionOne = getByTestId("option-item-Option 1-UTC");
    const optionTwo = getByTestId("option-item-Option 2-UTC");
    const optionThree = getByTestId("option-item-Option 3-UTC");

    expect(mainMenuTitle).toHaveTextContent("Main Menu");
    expect(optionOne).toBeInTheDocument();
    expect(optionTwo).toBeInTheDocument();
    expect(optionThree).toBeInTheDocument();
    expect(tree).toMatchSnapshot();
  });

  it("should render menu (hover)", async () => {
    const tree = render(
      <Menu
        title="Main Menu"
        closeOnClickOutside
        testId={testId}
        popoverAction="hover"
        popoverPosition="bottom-left"
        menuItems={menuItems}
        renderTarget={(props) => (
          <button {...props} type="button">
            Open Menu
          </button>
        )}
      />,
    );

    const { getByText, getByTestId } = tree;
    const btnElement = getByText("Open Menu");
    expect(btnElement).toBeInTheDocument();
    fireEvent.mouseOver(btnElement);

    waitFor(() => {
      const mainMenuTitle = getByTestId("menu-header-UTC");
      const optionOne = getByTestId("option-item-Option 1-UTC");
      const optionTwo = getByTestId("option-item-Option 2-UTC");
      const optionThree = getByTestId("option-item-Option 3-UTC");

      expect(mainMenuTitle).toBeInTheDocument();
      expect(optionOne).toBeInTheDocument();
      expect(optionTwo).toBeInTheDocument();
      expect(optionThree).toBeInTheDocument();

      expect(tree).toMatchSnapshot();
    });
  });

  it("should trigger click on option click", () => {
    const mockClickFn = jest.fn();

    const tree = render(
      <Menu
        title="Main Menu"
        closeOnClickOutside
        testId={testId}
        popoverAction="click"
        popoverPosition="bottom-left"
        menuItems={[
          {
            label: "Option 1",
            leftIcon: <Save />,
            onClick: () => {
              mockClickFn();
            },
          },
          {
            label: "Option 2",
            leftIcon: <Save />,
          },
          {
            label: "Option 3",
            leftIcon: <Save />,
          },
        ]}
        renderTarget={(props) => (
          <button {...props} type="button">
            Open Menu
          </button>
        )}
      />,
    );

    const { getByText, getByTestId } = tree;
    const btnElement = getByText("Open Menu");
    expect(btnElement).toBeInTheDocument();
    fireEvent.click(btnElement);

    const optionOne = getByTestId("option-item-Option 1-UTC");
    expect(optionOne).toBeInTheDocument();

    fireEvent.click(optionOne);

    expect(mockClickFn).toHaveBeenCalledTimes(1);
    expect(tree).toMatchSnapshot();
  });
});
