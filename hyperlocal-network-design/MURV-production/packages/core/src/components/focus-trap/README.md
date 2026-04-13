# Focus Trap

This package exposes functionality to trap focus within a specific DOM sub tree. The functionality is exposed both in the form of a Component and a HOC (Higher Order Component). <span style="color:red">**Please note that if you want to use this functionality, ensure that you provide a way for the users to exit the focus trapped area, by passing the `escapeHandler` callback. This is non negotiable!**<span>

## Usage

You can use the `FocusTrap` component just like any other component. It accepts all props that a regular `<div>` element accepts.

```tsx
import React, { KeyBoardEvent, useRef } from "react";
import { FocusTrap } from "@murv/core/components/focus-trap";

export const MyComponent: React.FC = () => {
  const outsideButtonRef = useRef<HTMLButtonElement>(null);

  const onKeyDown = (keyEvent: KeyBoardEvent) => {
    // The user needs to be able to exit from the focus trapped area.
    if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      outsideButtonRef.current?.focus();
    }
  };

  return (
    <div>
      <FocusTrap onKeyDown={onKeyDown}>
        <div>
          <button> Button 1 </button>
          <button> Button 2 </button>
        </div>
      </FocusTrap>
      <button ref={outsideButtonRef}> Outside Button </button>
    </div>
  );
};
```

Similarly, You can also use the `WithFocusTrap` HOC to wrap focus trap functionality to your components.

```tsx
import React from "react";
import { WithFocusTrap } from "@murv/core/components/focus-trap";

const MyComponent: React.FC = () => {
  const onKeyDown = (keyEvent: KeyBoardEvent) => {
    // The user needs to be able to exit from the focus trapped area.
    if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      /** Move focus outside */
    }
  };

  return (
    <div onKeyDown={onKeyDown}>
      <button> Button 1 </button>
      <button> Button 2 </button>
    </div>
  );
};

export const FocusTrappedComponent = WithFocusTrap(MyComponent);
```
