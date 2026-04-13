# Button Component

A carousel component is a user interface element that displays a rotating set of images or content items in a cyclic manner. It's commonly used on websites to showcase a collection of images, products, or other content in an interactive and visually appealing way.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)


## Installation

yarn install @MURV/button

## Usage

```jsx
import Carousel from "@MURV/Button";

<Carousel
  width="100%"
  autoPlay
  autoPlayDuration={3000}
  cardWidth={340}
  cardHeight={240}
  testId="carousel-container"
>
  <CardBodyContainer>
    <p>Sample heading of card</p>
    <p>Sample sub heading of card</p>
  </CardBodyContainer>
  <CardBodyContainer>
    <p>Sample heading of card</p>
    <p>Sample sub heading of card</p>
  </CardBodyContainer>
</Carousel>;
```

## Props

### Basic Props

**children**: Array of react nodes which will contain the content of the carousel.

**autoPlay**: This will tell if the carousel elements needs to slide automatically.

**autoPlayDuration**: Interval in milliseconds for autoplay of cards.

**testId**: Test id of the carousel for unit tests.

### Style Props

**cardWidth**: Width for the card inside carousel

**cardHeight**: Height for the card inside the carousel

**width**: Width of the carousel container

**itemSpacing**: Space between the items

### Callback Props

**leftNavCallBack**: Callback on left nav click

**rightNavCallBack**: Callback on right nav click
