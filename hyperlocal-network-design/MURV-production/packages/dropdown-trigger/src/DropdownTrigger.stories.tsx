import React, { useState, useRef } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { ExpandMore, MoreVert, Add } from "@murv/icons";
import { VisibilityToggleHelper, IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import DropdownTrigger from "./DropdownTrigger";
import DropdownField from "./DropdownField";

const meta: Meta = {
  title: "Components/DropdownTrigger",
  component: DropdownTrigger,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const DropdownTriggerDefault: Story = {
  render() {
    return <DropdownTrigger primaryText="Location" />;
  },
  args: {},
};

export const WithIcon: Story = {
  render() {
    return <DropdownTrigger primaryText="Locations" renderButtonIcon={() => <ExpandMore />} />;
  },
  args: {},
};

export const WithSimpleBadgeText: Story = {
  render() {
    return (
      <DropdownTrigger
        primaryText="Locations"
        badgeText="Malur BTS"
        withBorder={false}
        renderButtonIcon={() => <ExpandMore />}
      />
    );
  },
  args: {},
};

export const WithAdvancedBadgeText: Story = {
  render() {
    return (
      <DropdownTrigger
        primaryText="Creation Date"
        badgeText="10 May 2023 -> 10 May 2024"
        withBorder
        renderButtonIcon={() => <ExpandMore />}
      />
    );
  },
  args: {},
};

export const NoBorder: Story = {
  render() {
    return (
      <DropdownTrigger
        primaryText="Locations"
        withBorder={false}
        renderButtonIcon={() => <ExpandMore />}
      />
    );
  },
  args: {},
};

export const ControlledBadgeWidth: Story = {
  render() {
    return (
      <DropdownTrigger
        primaryText="Creation Date "
        badgeText="10 May 2023 -> 10 May 2024"
        maxBadgeWidth="180px"
        withBorder
      />
    );
  },
  args: {},
};

export const DisabledDropdown: Story = {
  render() {
    return (
      <DropdownTrigger
        primaryText="Locations"
        withBorder
        disabled
        renderButtonIcon={() => <MoreVert />}
      />
    );
  },
  args: {},
};

export const PrefixButtonIcon: Story = {
  render() {
    return (
      <DropdownTrigger
        primaryText="Creation Date "
        badgeText="10 May 2023 -> 10 May 2024"
        maxBadgeWidth="180px"
        withBorder
        prefixButtonIcon={() => <Add />}
      />
    );
  },
  args: {},
};

export const FieldWithLabel: Story = {
  render() {
    return (
      <div style={{ width: "400px" }}>
        <DropdownField
          label="Location"
          optional
          helpText="Select your preferred location"
          primaryText="Select Location"
          withBorder
          renderButtonIcon={() => <ExpandMore />}
        />
      </div>
    );
  },
  args: {},
};

export const FieldCompactMode: Story = {
  render() {
    return (
      <div style={{ width: "600px" }}>
        <DropdownField
          label="Location"
          optional
          primaryText="Select Location"
          withBorder
          compact
          buttonWidth="300px"
          renderButtonIcon={() => <ExpandMore />}
        />
      </div>
    );
  },
  args: {},
};

export const FieldWithError: Story = {
  render() {
    return (
      <div style={{ width: "400px" }}>
        <DropdownField
          label="Location"
          optional
          helpText="This field is required"
          primaryText="Select Location"
          withBorder
          isError
          renderButtonIcon={() => <ExpandMore />}
        />
      </div>
    );
  },
  args: {},
};

// Default State Stories
export const DefaultState: Story = {
  render() {
    return (
      <DropdownField
        label="Label"
        optional
        helpText="Help or instruction text goes here"
        primaryText="Select"
        withBorder
        width="300px"
      />
    );
  },
  args: {},
};

export const FocusedState: Story = {
  render() {
    return (
      <DropdownField
        label="Label"
        optional
        helpText="Help or instruction text goes here"
        primaryText="Select"
        withBorder
        width="300px"
        data-force-focus
      />
    );
  },
  args: {},
};

export const PressedActiveState: Story = {
  render() {
    return (
      <DropdownField
        label="Label"
        optional
        helpText="Help or instruction text goes here"
        primaryText="Select"
        withBorder
        width="300px"
        data-force-pressed
      />
    );
  },
  args: {},
};

export const ErrorState: Story = {
  render() {
    return (
      <DropdownField
        label="Label"
        optional
        helpText="Help or instruction text goes here"
        primaryText="Select"
        withBorder
        width="300px"
        isError
      />
    );
  },
  args: {},
};

export const DisabledState: Story = {
  render() {
    return (
      <DropdownField
        label="Label"
        optional
        helpText="Help or instruction text goes here"
        primaryText="Select"
        withBorder
        width="300px"
        disabled
      />
    );
  },
  args: {},
};

export const WithSelectedValue: Story = {
  render() {
    return (
      <DropdownField
        label="Location"
        optional
        helpText="Selected location is displayed"
        primaryText="Location"
        badgeText="New York"
        withBorder
        width="300px"
        renderButtonIcon={() => <ExpandMore />}
      />
    );
  },
  args: {},
};

export const WithDropdownOptions: Story = {
  render() {
    const [selectedValue, setSelectedValue] = useState<string>("");
    const toggleRef = useRef<IVisibilityToggleHelperRef>(null);

    const options = [
      { label: "New York", value: "ny" },
      { label: "Los Angeles", value: "la" },
      { label: "Chicago", value: "chi" },
      { label: "Houston", value: "hou" },
      { label: "Phoenix", value: "phx" },
    ];

    const handleSelect = (label: string) => {
      setSelectedValue(label);
      toggleRef.current?.close();
    };

    return (
      <div style={{ width: "300px" }}>
        <VisibilityToggleHelper
          ref={toggleRef}
          action="click"
          position="bottom-start"
          renderTarget={(props: any) => (
            <DropdownField
              label="Location"
              optional
              helpText="Select a location from the dropdown"
              primaryText={selectedValue || "Select Location"}
              withBorder
              renderButtonIcon={() => <ExpandMore />}
              {...props}
            />
          )}
        >
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              minWidth: "200px",
              padding: "8px 0",
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(option.label)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(option.label);
                  }
                }}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </VisibilityToggleHelper>
      </div>
    );
  },
  args: {},
};

export const WithDropdownOptionsCompact: Story = {
  render() {
    const [selectedValue, setSelectedValue] = useState<string>("");
    const toggleRef = useRef<IVisibilityToggleHelperRef>(null);

    const options = [
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2" },
      { label: "Option 3", value: "opt3" },
      { label: "Option 4", value: "opt4" },
    ];

    const handleSelect = (label: string) => {
      setSelectedValue(label);
      toggleRef.current?.close();
    };

    return (
      <div style={{ width: "500px" }}>
        <VisibilityToggleHelper
          ref={toggleRef}
          action="click"
          position="bottom-start"
          renderTarget={(props: any) => (
            <DropdownField
              label="Label"
              optional
              primaryText={selectedValue || "Select"}
              withBorder
              compact
              buttonWidth="200px"
              renderButtonIcon={() => <ExpandMore />}
              {...props}
            />
          )}
        >
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              minWidth: "200px",
              padding: "8px 0",
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(option.label)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(option.label);
                  }
                }}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </VisibilityToggleHelper>
      </div>
    );
  },
  args: {},
};

export const ActiveDropdownWithOptions: Story = {
  render() {
    const [selectedValue, setSelectedValue] = useState<string>("");

    const options = [
      { label: "Active Option 1", value: "opt1" },
      { label: "Active Option 2", value: "opt2" },
      { label: "Active Option 3", value: "opt3" },
    ];

    const handleSelect = (label: string) => {
      setSelectedValue(label);
    };

    return (
      <div style={{ width: "300px" }}>
        <VisibilityToggleHelper
          initialIsVisible
          action="click"
          position="bottom-start"
          renderTarget={(props: any) => (
            <DropdownField
              label="Label"
              optional
              helpText="Dropdown is currently open"
              primaryText={selectedValue || "Select"}
              withBorder
              renderButtonIcon={() => <ExpandMore />}
              {...props}
            />
          )}
        >
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              minWidth: "200px",
              padding: "8px 0",
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(option.label)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(option.label);
                  }
                }}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </VisibilityToggleHelper>
      </div>
    );
  },
  args: {},
};
