# Visibility Toggle Helper

This package contains the code for creating tab experiences as part of the MURV library. This document has the following sections,

- [Usage](#usage)
- [Props & Arguments](#props--arguments)
- [Links](#links)

## Usage

Visibility Toggle is a helper component that will be used in components such as Tooltip, Dropdown, TypeAhead, Selection Popover etc.

The component will have a target and a popover component. The popover will open when target is clicked or hovered.

Shown below is a code sample of the same.

```tsx
import React from "react";
import VisibilityToggleHelper from "@murv/visibility-toggle";

const SampleExample: React.FC = () => {
  return (
    <VisibilityToggleHelper target={<button>Target</button>}>
      <div style={{ padding: "8px", backgroundColor: "cyan" }}>I am Visible Now</div>
    </VisibilityToggleHelper>
  );
};
```

The above example is a rather simple one. Each of the units involved can be further customised by passing additional props/arguments. Please refer to the props & arguments section below for more information & Visit the storybook for visual examples of the same.

## Props & Arguments

The type signature of the props accepted by the `VisibilityToggleHelper` hook is mentioned below.

```typescript
export interface IVisibilityToggleHelperProps {
  /**
   * The Target element. The popover will be visible, depending on the interactions with this component.
   */
  target: React.ReactNode;
  /**
   * This is the Popover component to be shown.
   */
  children: React.ReactNode;
  action?: "hover" | "click";
  position?:
    | "right-center"
    | "right-top"
    | "right-bottom"
    | "left-center"
    | "left-top"
    | "left-bottom"
    | "top-center"
    | "top-right"
    | "top-left"
    | "bottom-center"
    | "bottom-right"
    | "bottom-left";
  /**
   * Offset from the target
   */
  offset?: { x: number; y: number };
  /**
   *  This callback will be called if visibility is changed.
   */
  onVisibilityChange?: (isVisible: boolean) => void;
  /**
   * If this is false, then the popover will not close on clicking outside the Target and Popover.
   */
  closeOnClickOutside?: boolean;
  /**
   *  Should Popover be visible by default
   */
  initialIsVisible?: boolean;
  /**
   *  Incase the child is interactive, we need to prevent the Popover from closing instantly when mouse leaves the target
   */
  isChildInteractive?: boolean;
  /**
   *  Time in ms to wait before closing the Popover when the child is interactive
   */
  childInteractiveTimeout?: number;
  testId?: string;
  id?: string;
}
```

### Imperative handles

Pass a forward ref to the component and from the consumer component we can handle the Popover open and close behaviour.

```typescript
export interface IVisibilityToggleHelperRef {
  close: () => void; // Close the Popover.
  open: () => void; // Open the Popover.
}
```

## Links

- [Solutioning document](https://docs.google.com/document/d/15VNdlBB5FfNTXbI4bsqTgePHwC4dUlAsLS48psWS9e8/edit)
