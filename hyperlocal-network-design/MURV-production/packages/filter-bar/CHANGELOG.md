# @murv/filter-bar

## 3.7.0

### Minor Changes

- d6a7455: checkbox tree virtualization release

### Patch Changes

- Updated dependencies [d6a7455]
- Updated dependencies [f84cd47]
- Updated dependencies [6724c4c]
- Updated dependencies [1c2d47e]
  - @murv/multi-select@1.1.0
  - @murv/visibility-toggle@1.1.0
  - @murv/provider@1.4.1

## 3.6.0

### Minor Changes

- c529c51: Murv Bugs fix

### Patch Changes

- Updated dependencies [c529c51]
  - @murv/dropdown-trigger@1.5.0

## 3.5.0

### Minor Changes

- 65f550a: icons upgrade to 0.0.68

### Patch Changes

- Updated dependencies [65f550a]
- Updated dependencies [2d21950]
  - @murv/dropdown-trigger@1.4.0
  - @murv/single-select@1.2.0
  - @murv/provider@1.4.0
  - @murv/button@1.3.0
  - @murv/input@1.4.0

## 3.4.1

### Patch Changes

- b005451: exposed a optional prop to reset selected(not applied) filters

## 3.4.0

### Minor Changes

- fbc1be8: New custom filter prop `isInteractive` to keep it visible

## 3.3.0

### Minor Changes

- f560b4f: Added Text input filter to filter bar

### Patch Changes

- Updated dependencies [f560b4f]
  - @murv/input@1.3.2

## 3.2.2

### Patch Changes

- af38f74: Add label and prefix icon in custom dropdown

## 3.2.1

### Patch Changes

- 72aa77d: Provider in package json

## 3.2.0

### Minor Changes

- 96db541: Type custom dropdown added in filter-bar

## 3.1.0

### Minor Changes

- c27b1ac: Icon version update 0.0.48

### Patch Changes

- Updated dependencies [c27b1ac]
  - @murv/dropdown-trigger@1.3.0
  - @murv/single-select@1.1.0
  - @murv/button@1.2.0

## 3.0.3

### Patch Changes

- 30f8a84: Callback call when click reset

## 3.0.2

### Patch Changes

- a036296: fixed misaligned icon and apply/reset buttons

## 3.0.1

### Patch Changes

- fc3ca58: Last filter should be rounded & prefix icon in filter
- Updated dependencies [fc3ca58]
  - @murv/dropdown-trigger@1.2.1
  - @murv/single-select@1.0.8
  - @murv/multi-select@1.0.3

## 3.0.0

### Major Changes

- 483b97c: ## Enhancements to FilterBar Functionality

  **Key Changes:**

  - **Dedicated Apply Button Function:**
    - The Apply button's functionality is now encapsulated within a separate, dedicated function. This improves code organization and maintainability by isolating the filtering logic.
  - **FilterBar Functionality Without Apply Button:**
    - The FilterBar now functions seamlessly even when the Apply button is absent. This ensures users can interact with filters and see immediate results if desired.
  - **Dynamic Apply Button State:**
    - The visibility of the Apply button is now dynamically controlled based on the presence and functionality of the `onFilterApply` prop. If `onFilterApply` is provided and relevant filter changes are made, the Apply button will appear. If not, it will remain hidden, preventing unnecessary button displays.
  - **Enhanced FilterBar Flexibility with `onFilterChange`:**
    - Each component within the FilterBar now features an `onFilterChange` event handler. This allows for independent usage and greater flexibility in handling filter interactions.
    - The `onFilterChange` function now provides two key parameters:
      - `currentValue`: Represents the currently selected filter value.
      - `filterValues`: Contains an array of all selected filter values for the given filter.
    - This empowers developers to manage filter states more efficiently and react to individual filter changes in real-time.
  - **Standardized Filter Value Structure:**
    - The structure of the values passed to the `onFilterApply` callback has been standardized to align with the `onFilterChange` callback.
    - Specifically, `filterValues` is now used consistently across both callbacks, ensuring a unified approach to filter state management.
  - **Dynamic Apply and Reset Button Visibility with `enableApplyResetButtons`:**
    - A new boolean prop called `enableApplyResetButtons` has been introduced.
    - This prop controls the visibility of both the Apply and Reset buttons.
    - Setting `enableApplyResetButtons` to `true` will render both buttons, and setting it to `false` will hide them.
    - This provides greater control over the visual presentation of the FilterBar, allowing for scenarios where these buttons might not be needed.

## 2.0.2

### Patch Changes

- c5b16d0: Patch to revert breaking changes
- b48382f: Roll back to previous changes.
- Updated dependencies [24c0cd7]
  - @murv/single-select@1.0.5
  - @murv/multi-select@1.0.2

## 2.0.0

### Major Changes

- a5cd23c: Enhancements for filterBar

### Patch Changes

- Updated dependencies [a911ce5]
  - @murv/visibility-toggle@1.0.1

## 1.2.1

### Patch Changes

- 3c6580d: close callback added for confirmation modal
- Updated dependencies [3c6580d]
  - @murv/single-select@1.0.2

## 1.2.0

### Minor Changes

- 0bc01be: Reverted icons to whitelisting

### Patch Changes

- Updated dependencies [0bc01be]
  - @murv/dropdown-trigger@1.2.0
  - @murv/button@1.1.0

## 1.1.1

### Patch Changes

- 1bbfe5a: Updated murv icons dependency
- Updated dependencies [1bbfe5a]
- Updated dependencies [cf89691]
  - @murv/dropdown-trigger@1.1.1
  - @murv/single-select@1.0.1

## 1.1.0

### Minor Changes

- ac77974: @murv/icons dependency bumped to latest

### Patch Changes

- Updated dependencies [ac77974]
  - @murv/dropdown-trigger@1.1.0

## 1.0.0

### Major Changes

- d153e21: Feat: First Major Release of MURV

### Patch Changes

- Updated dependencies [6fd2db2]
- Updated dependencies [d153e21]
  - @murv/single-select@1.0.0
  - @murv/visibility-toggle@1.0.0
  - @murv/single-date-select@1.0.0
  - @murv/range-date-select@1.0.0
  - @murv/dropdown-trigger@1.0.0
  - @murv/selection-card@1.0.0
  - @murv/multi-select@1.0.0
  - @murv/button@1.0.0

## 0.0.8

### Patch Changes

- 199229d: Filter bar apply/reset button logic

## 0.0.7

### Patch Changes

- 508e270: Filter bar handling for 'DAY' range picker and filter bar more filters count logic

## 0.0.6

### Patch Changes

- Updated dependencies [bf7bde7]
  - @murv/single-select@0.2.0

## 0.0.5

### Patch Changes

- 11f8583: Segmented control css fix
- Updated dependencies [11f8583]
  - @murv/dropdown-trigger@0.0.4
  - @murv/multi-select@0.0.7
  - @murv/range-date-select@0.0.4
  - @murv/single-date-select@0.0.4
  - @murv/single-select@0.1.5

## 0.0.4

### Patch Changes

- 06ea3a0: Filter Bar initital Publish
- Updated dependencies [06ea3a0]
  - @murv/single-date-select@0.0.3
  - @murv/range-date-select@0.0.3

## 0.0.3

### Patch Changes

- 475fa98: All select component internal package update and filter bar component
- Updated dependencies [475fa98]
- Updated dependencies [feac0fa]
  - @murv/single-date-select@0.0.2
  - @murv/range-date-select@0.0.2
  - @murv/single-select@0.1.4
  - @murv/multi-select@0.0.6
