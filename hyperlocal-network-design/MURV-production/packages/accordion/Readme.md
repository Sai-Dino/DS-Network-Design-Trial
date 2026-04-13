# Accordion Component

An accordion is a menu composed of vertically stacked headers that reveal more details when triggered (often by a mouse click). Since this web design pattern highlights only the most critical information of a section but makes the rest easily accessible, it’s a common element in responsive design.

## Installation

- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Examples](#examples)

## Installation

yarn install @MURV/accordion

## Usage

```jsx
import { Accordion } from "@MURV/accordion";

<Accordion>
  <Accordion.Header
    primaryTitle="Primary Accordion Title"
    secondaryTitle="Secondary Accordion Title"
  />
  <Accordion.Body>Accordion Content</Accordion.Body>
</Accordion>;
```

## Props

### Basic Props

Accordion Group -
styles: To override the group container style
dataTestId: For unit test cases.
id: For accessing the element.

Accordion -
dataTestId: For unit test cases.
id: For accessing the element.

Accordion Header -
badgeProps: To use badge component
icon: To use the icon in accordion header
tagProps: To use Tag component
disabled: To toggle disable the accordion
primaryTitle: (Mandatory Props) To use text as a primary title in the accordion header
secondaryTitle: To use text as a secondary title in the accordion header
tertiaryTitle: To use text as a tertiary title in the accordion header
dataTestId: For unit test cases.
id: For accessing the element.

# Examples

```jsx
import { Accordion, AccordionGroup } from '@MURV/accordion';

<AccordionGroup>
    <Accordion dataTestId="testId">
        <Accordion.Header
            badgeProps={
                content: '2'
            }
            tagProps= {
                tagText: "New"
            }
            primaryTitle="Primary Accordion Title"
            secondaryTitle={<div>Secondary Accordion Title (Injected as a react element)</div>}
            tertiaryTitle="Tertiary Title"
        />
        <Accordion.Body>
            Accordion Content
        </Accordion.Body>
    </Accordion>
    <Accordion>
    <Accordion.Header
        disabled={true}
        primaryTitle="Primary Accordion Title"
        secondaryTitle="Secondary Accordion Title"
    />
    <Accordion.Body>
        Accordion Content
    </Accordion.Body>
</Accordion>
</AccordionGroup>

```
