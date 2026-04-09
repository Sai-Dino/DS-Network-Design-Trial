export type IRatingProps = {
  /**
   * Id for the rating
   */
  id?: string;
  /**
   * Initial rating to be selected
   */
  rating: number;

  /**
   *  test id
   */
  dataTestId?: string;
} & (
  | {
      /**
       * Whether star is disabled or not
       * @default false
       */
      readOnly: false;
      /**
       * Passing onchange function when rating has happened.
       */
      onChange: (rating: number) => void;
    }
  | {
      /**
       * Whether star is disabled or not
       * @default true
       */
      readOnly: true;
      /**
       * onChange is not allowed when readOnly is true
       */
      onChange?: never;
    }
);
