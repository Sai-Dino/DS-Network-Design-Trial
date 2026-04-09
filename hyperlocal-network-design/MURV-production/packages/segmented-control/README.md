# Visibility Toggle Helper

This package contains the code for creating segmented control as part of the MURV library. This document has the following sections,

- [Usage](#usage)
- [Props & Arguments](#props--arguments)
- [Links](#links)

## Usage

Segmented control is used to pick one choice from a linear set of closely related choices, and immediately apply that selection.

Shown below is a code sample of the same.

```tsx
import React from "react";
import SegmentedControl from "@murv/segmented-control";

const SampleExample: React.FC = () => {
  return (
    <SegmentedControl
      id="segmented-control-example"
      dataTestId="test-id-sc"
      ariaLabel="Pick car option"
    >
      <SegmentedControl.Option text="Ferrari" badgeCount={8} />
      <SegmentedControl.Option text="Bentley" badgeCount={9} defaultSelected />
      <SegmentedControl.Option text="Toyota" badgeCount={3} disabled />
    </SegmentedControl>
  );
};
```

The above example is a rather simple one. Each of the units involved can be further customised by passing additional props/arguments. Please refer to the props & arguments section below for more information & Visit the storybook for visual examples of the same.

## Props & Arguments

The type signature of the props accepted by the `SegmentedControl` is mentioned below.

```typescript
/*
 * Interface describing the props for <SegmentedControl />
 * Since this is a interface, it can be further expanded by user
 */
export interface ISegmentedControlProps {
  id: string;
  dataTestId: string;
  children:
    | ReactElement<ISegmentedControlOptionsProps>
    | ReactElement<ISegmentedControlOptionsProps>[];
  disabled?: boolean;
  ariaLabel?: string;
}

/*
 * Interface describing the props for <SegmentedControl.Options />
 * Since this is a interface, it can be further expanded by user
 */
export interface ISegmentedControlOptionsProps {
  text: string;
  badgeCount: number;
  isSelected?: boolean;
  defaultSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}
```

## Links

- [Solutioning document](https://docs.google.com/document/d/1e1L9tFql7CddNpc0k3u16DqvhvgGMA8m5p9Eeg_sxjI/edit?usp=sharing)
