# Card Component

## Overview

The Card component provides a flexible and customizable card implementation for React applications for both desktop and mobile platforms. It serves as a foundation for creating interactive and visually appealing card-based user interfaces.

## Content

- [Installation](#installation)
- [Usage](#usage)
- [Components](#components)
- [Examples](#examples)
- [Links](#links)

## Installation

To install the Card component, use npm or yarn:

```bash
npm install @murv/card
```

or

```bash
yarn add @murv/card
```

## Usage

```jsx
import Card from "@murv/card";

const MyComponent = () => {
  return (
    <Card
      id="unique-card-id"
      onClick={() => console.log(`Card clicked!`)}
      interactable={true}
      disabled={false}
    >
      {/* Add Card.Header, Card.Body, and other components as needed */}
    </Card>
  );
};
```

## Components

### `Card`

The main Card component serves as a container for other card-related components. It supports various props like `id`, `onClick`, `interactable`, and `disabled`.

**Parameters:**

| Prop            | Type     | Required | Description                                                                                |
| --------------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| id              | string   | Yes      | Unique Id for the card                                                                     |
| testId          | string   | Yes      | Unique test Id for the card                                                                |
| interactable    | boolean  | No       | Whether the card is interactable (default: false)                                          |
| disabled        | boolean  | No       | Whether the card is disabled (default: false)                                              |
| onClick         | Function | No       | callback method on click of the entire card                                                |
| className       | string   | No       | CSS classname to override card container style (might break DLS design. Use with caution!) |
| containerStyles | object   | No       | CSS styles to override card container style (might break DLS design. Use with caution!)    |

### `Card.Header`

Represents the header section of the card. It can include a title, Icon, Tag, and MenuElement.

**Parameters:**

| Prop         | Type    | Required | Description                                                |
| ------------ | ------- | -------- | ---------------------------------------------------------- |
| title        | string  | Yes      | Title of the Card                                          |
| isActionable | boolean | No       | Should the header have a menu to act upon (default: false) |

### `Card.Header.Icon`

Represents Icon section of the header section of the card. It supports image props like `src`, `alt`, `svg` etc.

**Parameters:**

| Prop    | Type     | Required | Description                                             |
| ------- | -------- | -------- | ------------------------------------------------------- |
| src     | string   | No       | source of the icon image                                |
| alt     | string   | No       | Alternate text to be displayed if source is unavailable |
| svg     | svg      | No       | svg element for the icon                                |
| onClick | Function | No       | callback method on click of the icon                    |

### `Card.Header.Tag`

Represents Tag section of the header section of the card. It supports only `Tag` component imported from `@murv/tag`.

**Parameters:**

| Prop            | Type   | Required | Description                                                                                |
| --------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| className       | string | No       | CSS classname to override card container style (might break DLS design. Use with caution!) |
| containerStyles | object | No       | CSS styles to override card container style (might break DLS design. Use with caution!)    |

### `Card.Header.MenuElement`

Represents Menu section of the header section of the card. It supports only `Button` component imported from `@murv/button`.

**Parameters:**

| Prop            | Type   | Required | Description                                                                                |
| --------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| className       | string | No       | CSS classname to override card container style (might break DLS design. Use with caution!) |
| containerStyles | object | No       | CSS styles to override card container style (might break DLS design. Use with caution!)    |

### `Card.Body`

The body of the card where you can place horizontal or vertical items, images, text blocks, carousels, and other content.

**Parameters:**

| Prop            | Type     | Required | Description                                                                                |
| --------------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| className       | string   | No       | CSS classname to override card container style (might break DLS design. Use with caution!) |
| containerStyles | object   | No       | CSS styles to override card container style (might break DLS design. Use with caution!)    |
| onClick         | Function | No       | callback method on click of the icon                                                       |

### `Card.Body.HorizontalItem` and `Card.Body.VerticalItem`

Containers for organizing horizontal and vertical items within the card body. They can only have `Card.Body.HorizontalItem.Slot` or `Card.Body.VerticalItem.Slot` children respectively.

**Parameters:**

| Prop            | Type     | Required | Description                                                                                |
| --------------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| className       | string   | No       | CSS classname to override card container style (might break DLS design. Use with caution!) |
| containerStyles | object   | No       | CSS styles to override card container style (might break DLS design. Use with caution!)    |
| onClick         | Function | No       | callback method on click of the icon                                                       |

### `Card.Body.HorizontalItem.Slot` and `Card.Body.VerticalItem.Slot`

**Parameters:**

| Prop            | Type     | Required | Description                                                                                |
| --------------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| className       | string   | No       | CSS classname to override card container style (might break DLS design. Use with caution!) |
| containerStyles | object   | No       | CSS styles to override card container style (might break DLS design. Use with caution!)    |
| onClick         | Function | No       | callback method on click of the icon                                                       |

Represents each slot of horizontal or vertical containers

### `Card.Body.HorizontalItem.Slot.Thumbnail` and `Card.Body.HorizontalItem.Slot.Icon`

Represents a thumbnail and icon section respectively in a horizontally aligned slot. It can support image props like `src`, `alt`, `svg` etc.

**Parameters:**

| Prop    | Type     | Required | Description                                             |
| ------- | -------- | -------- | ------------------------------------------------------- |
| src     | string   | No       | source of the icon image                                |
| alt     | string   | No       | Alternate text to be displayed if source is unavailable |
| svg     | svg      | No       | svg element for the icon                                |
| onClick | Function | No       | callback method on click of the icon                    |

### `Card.Body.HorizontalItem.Slot.TextBlock`

Represents a textblock section in a horizontally aligned slot. It can support props like `primaryLine`, `secondaryLine` and `tertiaryLine` etc.

**Parameters:**

| Prop          | Type                 | Required | Description                                         |
| ------------- | -------------------- | -------- | --------------------------------------------------- |
| primaryLine   | string / JSX.element | Yes      | text or element to be displayed as the primary line |
| secondaryLine | string / JSX.element | No       | text or element to be displayed as the second line  |
| tertiaryLine  | string / JSX.element | No       | text or element to be displayed as the third line   |
| onClick       | Function             | No       | callback method on click of the icon                |

### `Card.Body.HorizontalItem.Slot.Link`

Represents a Link section in a horizontally aligned slot. It supports only `Link` component imported from `@murv/link`.

**Parameters:**

| Prop            | Type   | Required | Description                                                                                |
| --------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| className       | string | No       | CSS classname to override card container style (might break DLS design. Use with caution!) |
| containerStyles | object | No       | CSS styles to override card container style (might break DLS design. Use with caution!)    |

### `Card.Body.VerticalItem.Slot.Image`

Represents a Image section in a vertically aligned slot. It can support image props like `src`, `alt`, `svg` etc.

**Parameters:**

| Prop    | Type     | Required | Description                                             |
| ------- | -------- | -------- | ------------------------------------------------------- |
| src     | string   | No       | source of the icon image                                |
| alt     | string   | No       | Alternate text to be displayed if source is unavailable |
| svg     | svg      | No       | svg element for the icon                                |
| onClick | Function | No       | callback method on click of the icon                    |

### `Card.Body.VerticalItem.Slot.Video`

Represents a Video section in a vertically aligned slot. It supports props needed for `<video/>`

Certainly! Here's the TypeScript model formatted in the table format:

| Prop                       | Type                           | Required | Description                                                    |
| -------------------------- | ------------------------------ | -------- | -------------------------------------------------------------- |
| src                        | string                         | No       | Source of the video                                            |
| alt                        | string                         | No       | Alternate text for the video content                           |
| svg                        | svg                            | No       | SVG element for the video content                              |
| playIcon                   | ReactNode                      | No       | Custom play icon element                                       |
| playIconContainerStyles    | CSSProperties                  | No       | Styles for the container of the play icon                      |
| playIconStyles             | CSSProperties                  | No       | Styles for the play icon element                               |
| playIconClassName          | string                         | No       | CSS class for the play icon element                            |
| playIconContainerClassName | string                         | No       | CSS class for the container of the play icon                   |
| videoContainerStyles       | CSSProperties                  | No       | Styles for the container of the video                          |
| videoContainerClassName    | string                         | No       | CSS class for the container of the video                       |
| videoStyles                | CSSProperties                  | No       | Styles for the video element                                   |
| videoClassName             | string                         | No       | CSS class for the video element                                |
| videoControls              | boolean                        | No       | Whether to display video controls                              |
| videoAutoPlay              | boolean                        | No       | Whether to automatically play the video                        |
| videoLoop                  | boolean                        | No       | Whether to loop the video                                      |
| videoMuted                 | boolean                        | No       | Whether the video should be muted                              |
| videoPlaysInline           | boolean                        | No       | Whether the video should play inline                           |
| videoPreload               | "auto" \| "metadata" \| "none" | No       | Video preload behavior                                         |
| videoPoster                | string                         | No       | URL of an image to be displayed while the video is downloading |
| videoWidth                 | string                         | No       | Width of the video element                                     |
| videoHeight                | string                         | No       | Height of the video element                                    |
| trackSrc                   | string                         | No       | Source URL for a text track to be displayed with the video     |
| onClick                    | () => void                     | No       | Callback method triggered on click of the video                |

### `Card.Body.VerticalItem.Slot.TextBlock`

Represents a textblock section in a vertically aligned slot. It can support props like `primaryLine`, `secondaryLine` and `tertiaryLine` etc.

**Parameters:**

| Prop          | Type                 | Required | Description                                         |
| ------------- | -------------------- | -------- | --------------------------------------------------- |
| primaryLine   | string / JSX.element | Yes      | text or element to be displayed as the primary line |
| secondaryLine | string / JSX.element | No       | text or element to be displayed as the second line  |
| tertiaryLine  | string / JSX.element | No       | text or element to be displayed as the third line   |
| onClick       | Function             | No       | callback method on click of the icon                |

### `Card.Body.VerticalItem.Slot.Carousal`

Represents a Carousel section in a vertically aligned slot. It supports only `Carousel` component imported from `@murv/carousel`.

**Parameters:**

| Prop            | Type   | Required | Description                                                                                |
| --------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| className       | string | No       | CSS classname to override card container style (might break DLS design. Use with caution!) |
| containerStyles | object | No       | CSS styles to override card container style (might break DLS design. Use with caution!)    |

## Examples

Here are a few examples of using the Card component:

### Basic usage with header and body

```jsx
export const MetricCardStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);
```

### Card with list

```jsx
const ImageCardListWithTextStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      {[1, 2, 3, 4, 5].map((item) => (
        <Card.Body.HorizontalItem
          key={`murv-card-body-row-${item}`}
          aria-labelledby="murv-card-horizontal-item"
          tabIndex={0}
          containerStyles={item !== 5 ? { borderBottom: "2px solid #eee" } : {}}
        >
          <Card.Body.HorizontalItem.Slot tabIndex={0}>
            <Card.Body.HorizontalItem.Slot.Icon svg={<DummyImage />} />
          </Card.Body.HorizontalItem.Slot>
          <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
            <Card.Body.HorizontalItem.Slot.TextBlock
              primaryLine={<PrimaryLine text="Secondary Information" />}
              secondaryLine={<PrimaryLine text="tertiary Information" />}
            />
          </Card.Body.HorizontalItem.Slot>
          <Card.Body.HorizontalItem.Slot tabIndex={0}>
            <Card.Body.HorizontalItem.Slot.Icon svg={<Chevron />} />
          </Card.Body.HorizontalItem.Slot>
        </Card.Body.HorizontalItem>
      ))}
    </Card.Body>
  </Card>
);
```

### Vertical card

```jsx
const VerticalImageTextStory = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral">
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.VerticalItem aria-labelledby="murv-card-vertical-item" tabIndex={0}>
        <Card.Body.VerticalItem.Slot tabIndex={0}>
          <Card.Body.VerticalItem.Slot.Image
            svg={<DummyImageBig />}
            containerStyles={{ flex: 1 }}
          />
        </Card.Body.VerticalItem.Slot>
        <Card.Body.VerticalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.VerticalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Primary Information" />}
            secondaryLine={<PrimaryLine text="secondary Information" />}
            tertiaryLine={<PrimaryLine text="tertiary Information" />}
          />
        </Card.Body.VerticalItem.Slot>
      </Card.Body.VerticalItem>
    </Card.Body>
  </Card>
);
```

### Non interactable card

```jsx
const NonInteractableCard = () => (
  <Card interactable={false} id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <Tag tagText="New" tagStyle="red" />
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <Button buttonType="inline" buttonStyle="neutral" disabled>
          {(<MenuIcon />) as any}
        </Button>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
  </Card>
);

```

### Card will automatically handle invalid elements passed.

```jsx
const MetricCardWithInvalidElements = () => (
  <Card interactable id="murv-card" testId="murv-card" role="group" tabIndex={0}>
    <Card.Header title="Title of list" role="heading" aria-level={2} isActionable>
      <Card.Header.Icon svg={<HeaderIcon />} aria-hidden="true" />
      <Card.Header.Tag aria-label="New">
        <div>Some Tag</div>
      </Card.Header.Tag>
      <Card.Header.MenuElement>
        <div>Some Icon</div>
      </Card.Header.MenuElement>
    </Card.Header>
    <Card.Body>
      <Card.Body.HorizontalItem
        key="murv-card"
        aria-labelledby="murv-card-horizontal-item"
        tabIndex={0}
      >
        <Card.Body.HorizontalItem.Slot tabIndex={0} containerStyles={{ flex: 1 }}>
          <Card.Body.HorizontalItem.Slot.TextBlock
            primaryLine={<PrimaryLine text="Delivery Speed" />}
            secondaryLine={<SecondaryLine />}
            tertiaryLine={<TeriaryLine />}
          />
        </Card.Body.HorizontalItem.Slot>
      </Card.Body.HorizontalItem>
    </Card.Body>
    <div>Some Invalid Element</div>
  </Card>
);
```

## Links

- [Figma](https://www.figma.com/file/o2VrJT48UsU1nlbjFkkNp2/MURV-Master-Components?node-id=2836%3A14323&mode=dev)
- [Solution document](https://docs.google.com/document/d/15FVRoCe0LhFL58pzZjL2_WhRU7htgDpiCaLNtD8bWpI/edit#heading=h.xuzx86sv6g3o)
