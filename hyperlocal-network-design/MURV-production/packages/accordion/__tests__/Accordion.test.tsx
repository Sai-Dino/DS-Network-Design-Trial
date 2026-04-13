import React from "react";
import '@testing-library/jest-dom';
import { render, fireEvent } from "murv/test-utils";
import { Accordion } from "../src";

describe("Accordion component", () => {
  // Default State Testing
  it("should render accordion", () => {
    const { getByText } = render(
        <Accordion>
            <Accordion.Header primaryTitle="test title" />
            <Accordion.Body>
                Test Body
            </Accordion.Body>
        </Accordion>
    );
    const headerElement = getByText("test title");
    expect(headerElement).toBeInTheDocument();
  });

//   Expanded State
  it('should expand accordion on click', () => {
    const { getByText } = render(
        <Accordion>
            <Accordion.Header primaryTitle="test title" />
            <Accordion.Body>
                Test Body
            </Accordion.Body>
        </Accordion>
    );
    const headerElement = getByText("test title");
    expect(headerElement).toBeInTheDocument();
    fireEvent.click(headerElement);

    const bodyElement = getByText("Test Body")
    expect(bodyElement).toBeInTheDocument();
  });

  // Hover State
  it('renders accordion in hover state', () => {
    const { getByTestId } = render(
      <Accordion>
          <Accordion.Header primaryTitle="test title" />
          <Accordion.Body>
              Test Body
          </Accordion.Body>
      </Accordion>
    );
    const headerElement = getByTestId("accordion-header");
    fireEvent.mouseOver(headerElement);
    setTimeout(() => {
        expect(headerElement).toHaveStyle(`background-color: rgb(206, 225, 255);`);
    }, 100)
  });
});

describe("Accordion component snapshots", () => {
  it("matches snapshot with default state", () => {
    const { asFragment } = render(
        <Accordion>
            <Accordion.Header primaryTitle="test title" />
            <Accordion.Body>
                Test Body
            </Accordion.Body>
        </Accordion>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot on click of header", () => {
    const { asFragment, getByText } = render(
        <Accordion>
            <Accordion.Header primaryTitle="test title" />
            <Accordion.Body>
                Test Body
            </Accordion.Body>
        </Accordion>
    );
    const headerElement = getByText("test title");
    fireEvent.click(headerElement);
    const bodyElement = getByText("Test Body")
    expect(headerElement).toBeInTheDocument();
    expect(bodyElement).toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });
});
