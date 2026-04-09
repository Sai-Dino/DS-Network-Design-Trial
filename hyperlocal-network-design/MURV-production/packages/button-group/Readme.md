# ButtonGroup Component

The ButtonGroup component is a reusable component that allows you to render a group of buttons based on an array of button props. It provides flexibility in configuring each button's appearance, behavior, and state.

## Installation

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Examples](#examples)

## Installation

yarn install @MURV/button-group

## Usage

```jsx
import { ButtonGroup } from '@MURV/button-group';
import { Add } from "@murv/icons";
import { ButtonProps } from '@murv/button/src/types';

const btnGroups : ButtonProps[] = [
      { prefixIcon: Add, buttonType: 'tertiary',className:'tert-btn', buttonStyle: 'brand', onClick: mockOnClick },
      { buttonType: 'tertiary',className:'disabled-btn', buttonStyle: 'brand',onClick: mockOnClick, children: 'Click Me!!', disabled: true },
      { buttonType: 'primary',className:'load-btn', buttonStyle: 'brand', children: 'Loading...', isLoading: true },
    ]

<ButtonGroup buttons={btnGroups}
/>

```

## Props

### Basic Props

id: For accessing the element.

dataTestId: For unit test cases.

alignment: Determine the alignment of button groups. left is default.

buttons\*: An array of objects that represent each individual button in the group.

padding: For overriding padding style

spacing: For overriding gap style

# Examples

```jsx
import { ButtonGroup } from '@MURV/button-group';
import { ButtonProps } from '@murv/button/src/types';
import { Add } from "@murv/icons";

const btnGroups : ButtonProps[] = [
      { PrefixIcon: Add, buttonType: 'tertiary',className:'tert-btn', buttonStyle: 'brand', onClick: mockOnClick },
      { buttonType: 'tertiary',className:'disabled-btn', buttonStyle: 'brand',onClick: mockOnClick, children: 'Click Me!!', disabled: true },
      { buttonType: 'primary',className:'load-btn', buttonStyle: 'brand', children: 'Loading...', isLoading: true },
    ]

<ButtonGroup
  buttons={btnGroups}
  spacing="10px"
  padding= "0px"
/>

```
