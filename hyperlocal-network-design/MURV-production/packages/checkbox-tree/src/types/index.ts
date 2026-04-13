export enum CheckModel {
  ALL, // ALL -> Everything that got checked will be added to the serialised array.
  LEAF, // ALL -> Only leaf nodes that got checked will be added to the serialised array.
}

export interface ITreeNode {
  id?: string; // Unique ID for label-value communication.
  label: string;
  value: string;
  disabled?: boolean;
  description?: string;
  children?: ITreeNode[]; // recursive nodes for nested tree.
}

export interface IFlattenedNode extends ITreeNode {
  checked?: boolean;
  checkState?: number;
  parent?: ITreeNode;
  isChild: boolean;
  isParent: boolean;
  isLeaf: boolean;
  disabled: boolean;
}

export interface ICheckBoxTreeProps {
  id?: string;
  selected: string[]; // Selected nodes stated
  onSelect: (selectedItems: string[]) => void; // On new node select/unselect handler.
  nodes: ITreeNode[]; // recursive nodes for nested tree.
  shouldRender: (node: ITreeNode) => boolean; // Decides whether a node should render in tree or not.
  checkModel?: keyof typeof CheckModel;
  dataTestId?: string;
}

export type FlattenedNodes = Record<string, IFlattenedNode>;

export type ToggleKeys = Record<"checked", Array<keyof FlattenedNodes>>;
