export interface SearchFeedbackProps {
  totalItemCount: number;
  foundItemCount: number;
  notFoundItemCount: number;
  foundItems?: string[];
  notFoundItems?: string[];
  actionLabel?: string;
  onReset?: () => void;
  width?: string;
  showActions?: boolean;
  displayMode?: "search" | "total";
}
