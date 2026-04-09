## Drilldown Bar

This is a composite component of search, search feedback, buttons and filter bar (not present currently)

## Installation

To install the Card component, use npm or yarn:

```bash
npm install @murv/drilldown-bar
```

or

```bash
yarn add @murv/drilldown-bar
```

## Usage

```jsx
import { DrilldownBar } from "@murv/drilldown-bar";

const MyComponent = (props) => {
  return (
    <DrilldownBar id="drilldown-bar-id" datatest-id="drilldown-bar-datatest-id">
      <DrilldownBar.Line>
        <DrilldownBar.Search {...props?.searchProps} />
      </DrilldownBar.Line>
      <DrilldownBar.Line>
        <DrilldownBar.SearchFeedback {...props?.searchFeedbackProps} />
        <DrilldownBar.Button {...props?.buttonProps} />
      </DrilldownBar.Line>
    </DrilldownBar>
  );
};
```
