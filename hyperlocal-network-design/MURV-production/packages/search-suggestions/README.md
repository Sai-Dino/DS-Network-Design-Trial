# Search Suggestions

This package contains the code for creating search suggestions as part of the MURV library. This document has the following sections,

- [Usage](#usage)
- [Props & Arguments](#props--arguments)
- [Links](#links)

## Usage

Search suggestions are used to show search history or autosuggestion base on user search.

Shown below is a code sample of the same.

```tsx
import React from "react";
import useSearchSuggestions from "@murv/search-suggestions";

const SampleExample: React.FC = () => {
  const args = {
    id: "example-id",
    dataTestId: "example-test-id",
    options: [{ text: "Option 1" }, { text: "Option 2" }, { text: "Option 3" }],
    optionsType: "history" as const,
  };
  const [{ SearchSuggestion }, { selectedOption, closedOption }] = useSearchSuggestions(args);
  return <SearchSuggestion />;
};
```

The above example is a rather simple one. Each of the units involved can be further customised by passing additional props/arguments. Please refer to the props & arguments section below for more information & Visit the storybook for visual examples of the same.

## Props & Arguments

The type signature of the props accepted by the `Search Suggestions` is mentioned below.

```typescript
/*
 * Interface describing the props for <SearchSuggestion />
 * Since this is a interface, it can be further expanded by user
 */
export interface ISearchSuggestionsProps {
  id: string;
  dataTestId: string;
  options: Array<ISearchOption>;
  optionsType: "history" | "suggest";
  ariaLabel?: string;
}
```
