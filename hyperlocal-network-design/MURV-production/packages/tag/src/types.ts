export interface TagProps {
  /**
   * Id for tag component
   */
  id?: string;
  /**
   * Pass test id for unit tests
   */
  dataTestId?: string;
  /**
   * Pass the text to show in tag
   */
  tagText: string;
  /**
   * Pass the alignment prop
   * @default 'regular'
   */
  alignment?: "regular" | "left";
  /**
   * Pass the tagStyle prop to decide the color of the tag
   * @default "submitted"
   */
  tagStyle?: "red" | "yellow" | "green" | "black" | "grey" | "success" | "submitted" | "rejected" | "pending" | "expired"
  /**
   * Pass the custom background color of the tag
   */
  backgroundColor?: string;
  /**
   * Pass the custom text color of the tag
   */
  textColor?: string;
}