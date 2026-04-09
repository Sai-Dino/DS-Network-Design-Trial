export interface ISearchProps {
  /* The Id added to the input element */
  id: string;

  /* Used for accesibility attribute aria-label */
  name?: string;

  /* Added to the search wrapper data attribute */
  testId?: string;

  /* The input element placeholder text and aria-placeholder attribute */
  placeholder?: string;

  /* The initial query to set the search input value */
  initialQuery?: string;

  /* On search handler called on click of search button */
  onSearch?: (query: string, id: string) => void;

  /* On clear handler called on click of clear button */
  onClear?: (id: string) => void;

  /* Debounce timer used to debounce On change handler , defaults to 300 (ms) */
  debounceTimer?: number;

  /* On change handler,  called based on debounce timer */
  onChange?: (query: string, id: string) => void;

  /* Search disable boolean */
  disabled?: boolean;

  /* To Show the Close/Reset Icon always */
  alwaysShowCloseIcon?: boolean;

  /* On Reset handler,  called on click of Cross Icon */
  onReset?: (query: string, id: string) => void;

  /* On Focus handler,  callback for focus of search input */
  onFocus?: (event: React.FocusEvent) => void;

  /* On Blur handler, callback for on blur of search input */
  onBlur?: (event: React.FocusEvent) => void;

  /* When true, show the prefix search icon on desktop viewports as well */
  prefixIcon?: boolean;

  /* Optional renderer for a custom suffix component placed at the right end */
  renderSuffix?: () => React.ReactNode;
}

/* This is the type for the keys exposed via ref.current if a ref is passed */
export type RefType = {
  focus: () => void;
  clear: () => void;
  blur: () => void;
} | null;
