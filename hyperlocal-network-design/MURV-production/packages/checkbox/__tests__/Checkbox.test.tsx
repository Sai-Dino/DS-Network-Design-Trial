import { RenderResult, render, fireEvent } from "test-utils";
import React, { useState } from "react";
import "@testing-library/jest-dom";
import { CheckboxGroup } from "../src";

const WrappedControlledComponent = () => {
    const [value, setValue] = useState(["bike"]);

    return (
      <CheckboxGroup
        dataTestId="checkboxGroupControlled"
        value={value}
        onChange={(e) => {
            let finalValue: string[] = [];
            if (e.target.checked)
                finalValue = [...value, e.target.value];
            else
                finalValue = value.filter((val) => val !== e.target.value);
            // @ts-ignore
            setValue(finalValue);
        }}
        options={[
            { id: 'checkbox1', label: "Checkbox 1", value: "Checkbox 1", disabled: true },
            {
                id: 'checkbox2',
                label: "Checkbox 2",
                value: "Checkbox 2",
                inputProps: {
                    defaultChecked: true,
                },
            },
        ]}
      />
    );
};

describe("CheckboxGroup", () => {
    let screen = {} as RenderResult;

    beforeEach(() => {
        screen = render(<WrappedControlledComponent />);
    });

    test("renders correctly", () => {
        const checkboxGroup = screen?.getByTestId("checkboxGroupControlled");
        expect(checkboxGroup).toBeInTheDocument();
    });

    test("Enabled option click", () => {
        const enabledCheckboxOption = screen?.getByLabelText("Checkbox 2");
        fireEvent.click(enabledCheckboxOption);

        const enabledCheckboxInput = screen?.getByDisplayValue("Checkbox 2");
        expect(enabledCheckboxInput).toBeChecked();
    });

    test("Disabled Option", () => {
        const disabledCheckboxInput = screen?.getByDisplayValue("Checkbox 1");
        expect(disabledCheckboxInput).toBeDisabled();
    });

    test("Checkbox Group snapshot Controlled", () => {
        expect(screen?.asFragment()).toMatchSnapshot();
    });

    afterEach(() => {
        screen.unmount();
    });
});
