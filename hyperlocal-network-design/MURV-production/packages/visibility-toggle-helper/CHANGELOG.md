# @murv/visibility-toggle

## 1.1.0

### Minor Changes

- f84cd47: popover overflow when submenu content change on navigation-rail

### Patch Changes

- 1c2d47e: fix: hide popover Content div with display:none until popover attribute is set, preventing phantom divs from disrupting flex layout and pushing NavigationRail items out of view. Also improved popup hover/blur stability for interactive children.

## 1.0.3

### Patch Changes

- 436e89d: Clamp popover position to viewport bounds to prevent overflow beyond screen edges
- fded4e2: fix the positin of pop up screen on navigation rail menu

## 1.0.1

### Patch Changes

- a911ce5: PR-487
  dependancy update of useEffect for attaching click and hover events and target and popUp(when child is interactive)

## 1.0.0

### Major Changes

- d153e21: Feat: First Major Release of MURV

## 0.1.1

### Patch Changes

- e934b00: https://github.com/facebook/react/issues/27479
  https://github.com/facebook/react/pull/27981
  Popover API is not supported in React or ReactDom. The workaround is we will add popover api to the component with JS. Till, the popover property is not added to Element, don't mount the content inside it.
  PR: https://github.fkinternal.com/Flipkart/MURV/pull/367

## 0.1.0

### Minor Changes

- df2e478: Integrated popover api with Visibility Toglle (https://github.fkinternal.com/Flipkart/MURV/pull/343/files)

## 0.0.6

### Patch Changes

- ef89bf3: Dynamic element click inside popover fix
