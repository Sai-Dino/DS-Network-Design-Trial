# Avatar Component

The Avatar component is typically used to represent a user, often in the form of a small image or initials. It's a visual representation of an entity, such as a person, in a compact and recognizable form.

## Installation

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Examples](#examples)

## Installation

yarn install @murv/avatar

## Usage

```jsx
import Avatar from '@murv/avatar';

<Avatar type='text' size='large' badgeProps={{
      type: "highlight",
    }}>
       <img src="https://st.depositphotos.com/2290789/4327/i/950/depositphotos_43274805-stock-illustration-black-panther-head.jpg" alt="panther"></img>
</Avatar>
/>

```

## Props

### Basic Props

dataTestId: Pointer to test the element.

size: Define the size of avatar - small, medium or large

type: Define the type of avatar - Image, Icon, or Text

children: Content of Avatar

badgeProps: Used to render Badge component with respective props

# Examples

**Icon Avatar**

```jsx
import Avatar from "@murv/avatar";

<Avatar
  dataTestId="icon-avatar"
  type="icon"
  size="large"
  badgeProps={{
    type: "highlight",
  }}
>
  <Person />
</Avatar>;
```

**Image Avatar**

```jsx
import Avatar from "@murv/avatar";

<Avatar
  type="image"
  size="large"
  badgeProps={{
    type: "highlight",
  }}
>
  <img
    src="https://st.depositphotos.com/2290789/4327/i/950/depositphotos_43274805-stock-illustration-black-panther-head.jpg"
    alt="panther"
  ></img>
</Avatar>;
```

**Text Avatar**

```jsx
import Avatar from "@murv/avatar";

<Avatar
  type="text"
  size="large"
  badgeProps={{
    type: "highlight",
  }}
>
  MU
</Avatar>;
```
