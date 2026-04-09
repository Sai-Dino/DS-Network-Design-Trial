/**
 * Single Select.
 */
interface ISingleSelect {
  /**
   * pills will be single or multi select.
   */
    isMultiSelect: false;
  /**
   * Seclected Pills Value sent by the consumer either in string or array of string.
   * Fot multi select this must be array of string and for single select only string.
   */
    selectedPills: string;
}
/**
 * Multiple Select.
 */
interface IMultiSelect {
    /**
     * pills will be single or multi select.
     */
    isMultiSelect: true;
    /**
     * Seclected Pills Value sent by the consumer either in string or array of string.
     * Fot multi select this must be array of string and for single select only string.
     */
    selectedPills: string[];
}
/**
 * Pills context.
 */
export interface IPillsBarContext {
    onSelect: (pillId: string) => void;
    isPrefixReplaceable: boolean;
    selectedPills: string | string[];
}
/**
 * Pills provider.
 */
export interface IPillsBarProvider {
  /**
   * Is the Prefix icon is replacable
   */
    isPrefixReplaceable?: boolean;
  /**
   * pills will be single or multi select.
   */
    isMultiSelect: boolean;
    /**
     * Seclected Pills Value sent by the consumer either in string or array of string.
     * Fot multi select this must be array of string and for single select only string.
     */
    selectedPills: string | string[];
    /**
     * Callback too get the seclected pills value.
     */
    onSelectedChange: (pills: string | string[]) => void;
}
/**
 * Represents the props for the Pills Bar component.
 */
export interface IBasePillsBarProps {
    /**
     * The gap between the Pills.
     */
    gap?: number;
  /**
   * The Vertical space between pills and the container.
   */
    paddingVertical?: number;
    /**
     * The Horizontal space between pills and the container.
     */
    paddingHorizontal?: number;
    /**
     * Pills inside the container can be scrolled or wrapped to the next row.
     */
    isScroll?: boolean;
    /**
     * Test id for the bar.
     */
    dataTestId?: string;
}
export type TPillsBarProps = (ISingleSelect | IMultiSelect) &
    IBasePillsBarProps & {
        /**
         * Is the Prefix icon is replacable
         */
        isPrefixReplaceable?: boolean;
    /**
     * Callback too get the seclected pills value.
     */
    onSelectedChange: (pills: string | string[]) => void;
    };
