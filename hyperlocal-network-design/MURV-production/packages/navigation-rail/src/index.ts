import BaseNavigationRailItem from "./components/NavigationRailItem";
import NavigationRail from "./NavigationRail";
import { INavigationRailItem } from "./types";

const NavigationRailItem = BaseNavigationRailItem as React.FC<INavigationRailItem>;

export * from "./types";
export { NavigationRail, NavigationRailItem };
export default NavigationRail;
