import React from "react";
import "@testing-library/jest-dom";
import { render } from "murv/test-utils";
import { Label } from "@murv/label";

const mockProps = {
    label: "Test Label",
    description: "Sample Test Label",
    id: "test-label",
    testId: "test-label",
    disabled: false,
    rtl: false,
};

describe("Label", () => {
    test("renders correctly", () => {
        const { getByTestId } = render(<Label {...mockProps} />);
        const label = getByTestId("test-label");
        expect(label).toBeInTheDocument();
    });

    test("capture Label Snapshot", () => {
        const { asFragment } = render(<Label {...mockProps} />);
        expect(asFragment()).toMatchSnapshot();
    });

    test("capture Disabled Label Snapshot", () => {
        const { asFragment } = render(
            <Label {...mockProps} disabled />
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test("capture RTL Label Snapshot", () => {      
        const { asFragment } = render(
            <Label {...mockProps} rtl />
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test("capture Label with Description Snapshot", () => {
        const { asFragment } = render(
            <Label {...mockProps} description="Sample Description" />
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test("capture Label with Description and Disabled Snapshot", () => {
        const { asFragment } = render(
            <Label {...mockProps} description="Sample Description" disabled />
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test("capture Label with Description and RTL Snapshot", () => {
        const { asFragment } = render(
            <Label {...mockProps} description="Sample Description" rtl />
        );
        expect(asFragment()).toMatchSnapshot();
    });

    test("capture Label with Description, Disabled and RTL Snapshot", () => {
        const { asFragment } = render(
            <Label {...mockProps} description="Sample Description" disabled rtl />
        );
        expect(asFragment()).toMatchSnapshot();
    });
});