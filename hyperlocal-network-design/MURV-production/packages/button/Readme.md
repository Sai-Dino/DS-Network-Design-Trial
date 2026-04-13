# Button Component

The Button component is a versatile component that can be customized based on various styles, sizes, and types.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Styles and Theming](#styles-and-theming)
- [Examples](#examples)

## Installation

yarn install @MURV/button

## Usage

```jsx
import Button from "@MURV/Button";

<Button>Click Here !!</Button>;
```

## Props

### Basic Props

children: For Text element.

type: Currently we have primary, secondary, tertiary, inline, ascent and floating button types.

className: button Class to access the element.

disabled: to disable the button

isLoading: to render loading state.

dataTestId: pointer for unit test cases.

PrefixIcon: icon to set as prefix label.

SuffixIcon: icon to set as suffix label.

### Style Props

size: large or small and this will reflect on < 600px screens.

buttonType: declare button type of submit, button (default) and reset.

buttonStyle: currenlty we have brand(default), danger and neutral styles

### Callback Props

onClick: button click handler.

suffixCallback: cb will happen on clicking the suffix icon.

## Styles and Theming

Currently we have types of primary, secondary, tertiary, inline, ascent and floating.

With this, the button styles can be incorporated.

Styles available are brand(default), danger and neutral

Ex:

```jsx
<Button buttonType="inline" buttonStyle="danger">
  Click Here !!
</Button>
```

Also we have ellipsis behaviour where if button width exceeds 280px on web and 328px on < 600px screens then the text will be overflown with ellipsis style.

## Examples

**Primary Button**

```jsx
<Button>Click Here !!</Button>
```

**Ascent Button**

```jsx
<Button buttonType="ascent">Click Here !!</Button>
```

**Floating Button**

```jsx
<Button buttonType="floating">Click Here !!</Button>
```

**Inline Button**

```jsx
<Button buttonType="inline">Click Here !!</Button>
```

**Secondary Button**

```jsx
<Button buttonType="secondary">Click Here !!</Button>
```

**Tertiary Button**

```jsx
<Button buttonType="tertiary">Click Here !!</Button>
```

**Brand Inline**

```jsx
<Button buttonType="inline" buttonStyle="brand">
  Click Here !!
</Button>
```

**Danger Inline**

```jsx
<Button buttonType="inline" buttonStyle="danger">
  Click Here !!
</Button>
```

**Neutral Secondary**

```jsx
<Button buttonType="secondary" buttonStyle="neutral">
  Click Here !!
</Button>
```

**Danger tertiary**

```jsx
<Button buttonType="tertiary" buttonStyle="danger">
  Click Here !!
</Button>
```

**Disabled button**

```jsx
<Button disabled>Click Here !!</Button>
```

**Button in loading state**

```jsx
<Button isLoading>Click Here !!</Button>
```
