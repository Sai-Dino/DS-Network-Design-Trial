# Bottom Sheet

## Usage

There are 3 mandetory props for BottomSheet component :

- `isOpen` - Determines whether the bottom sheet is open or closed.
- `setOpen` - Callback function to toggle the state, this is triggered when the user stops dragging the bottom sheet.
  - Not passing this prop will throw an error _obj.setOpen is not a function_
- `dataTestId` - A unique test identifier used for testing purposes.

```jsx
export const BottomSheetComponent = (args) => {
  const [open, setOpen] = useState(false);
  const { HeaderProps, ContentProps, ActionsProps } = args;
  return (
    <div>
      <button type="button" data-testid="bottomsheet-button" onClick={() => setOpen(true)}>
        Open Bottomsheet
      </button>
      <BottomSheet isOpen={open} setOpen={() => setOpen(false)} dataTestId="bottom-sheet-component">
        <BottomSheet.Header dataTestId="bottom-sheet-header">
          <BottomSheet.Header.BackNavigation onBack={() => {}} />
          <BottomSheet.Header.Title dataTestId="bottom-sheet-title">
            {HeaderProps.titleProps}
          </BottomSheet.Header.Title>
          <BottomSheet.Header.CloseIcon closeSheet={() => setOpen(false)} />
        </BottomSheet.Header>
        <BottomSheet.Content dataTestId="bottom-sheet-content">{ContentProps}</BottomSheet.Content>
        <BottomSheet.Footer dataTestId="bottom-sheet-footer">{ActionsProps}</BottomSheet.Footer>
      </BottomSheet>
    </div>
  );
};
```
