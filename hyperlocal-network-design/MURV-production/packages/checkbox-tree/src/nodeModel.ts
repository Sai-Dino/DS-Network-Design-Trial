import { generateRandomId } from "@murv/core/utils/generate-random-id";
import { CheckModel, FlattenedNodes, ITreeNode, ToggleKeys } from "./types";

const nodeHasChildren = (node: ITreeNode) => Array.isArray(node.children);

export const getNodeModel = () => {
  let flatNodes: FlattenedNodes = {};
  let flatNodesValueIdMap: Record<string, Set<string>> = {};

  const getNode = (id: string) => flatNodes?.[id];

  const getFlatNodes = () => flatNodes;

  const reset = () => {
    flatNodes = {};
    flatNodesValueIdMap = {};
  };

  const flattenNodes = (nodes: ITreeNode[] = [], parent?: ITreeNode): void => {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return;
    }

    nodes.forEach((node) => {
      const isParent = nodeHasChildren(node);

      // If id is not provided, use a generated id
      if (!node.id) {
        let loopCount = 0;
        do {
          // eslint-disable-next-line no-param-reassign
          node.id = generateRandomId();
          loopCount += 1;
        } while (flatNodes?.[node.id] !== undefined && loopCount < 1000); // loop to avoid id collision
      }

      if (flatNodes?.[node.id] !== undefined) {
        // throws if the id is provided and is not unique, or if the loop count is greater than 1000 (most unlikely)
        throw new Error(`Duplicate id '${node.id}' detected. All node ids must be unique.`);
      }

      flatNodes[node.id] = {
        ...node,
        parent,
        isChild: parent?.id !== undefined,
        isParent,
        isLeaf: !isParent,
        disabled: node.disabled || flatNodes?.[parent?.id as string]?.disabled,
      };

      // Build value to ID mapping for optimization
      if (node.value !== undefined) {
        if (!flatNodesValueIdMap[node.value]) {
          flatNodesValueIdMap[node.value] = new Set();
        }
        flatNodesValueIdMap[node.value].add(node.id);
      }

      flattenNodes(node?.children, node);
    });
  };

  /**
   * Right now only checked key has to be deserialized.
   * But incase if we are bringing in expand behaviour Then it will a possible key as well.
   */

  const deserializeCheckedByValues = (lists: ToggleKeys) => {
    const listKeys = Object.keys(lists) as Array<keyof ToggleKeys>;

    Object.keys(flatNodes).forEach((id) => {
      listKeys?.forEach((listKey) => {
        flatNodes[id][listKey] = false;
      });
    });

    listKeys.forEach((listKey) => {
      lists[listKey]?.forEach((value) => {
        const nodeIds = flatNodesValueIdMap[value];
        if (nodeIds) {
          nodeIds.forEach((id) => {
            flatNodes[id][listKey] = true;
          });
        }
      });
    });
  };

  const serializeListToValues = () => [
    ...Object.keys(flatNodes).reduce((set, id) => {
      if (flatNodes?.[id]?.checked) {
        set.add(flatNodes[id].value);
      }

      return set;
    }, new Set<string>()),
  ];

  const toggleNode = (nodeId: string, key: keyof ToggleKeys, toggleValue: boolean) => {
    if (!flatNodes?.[nodeId]?.disabled) {
      flatNodes[nodeId][key] = toggleValue;
    }
  };

  const isEveryChildChecked = (node?: ITreeNode) =>
    (node?.children || []).every((child) => getNode(child.id as string).checked);

  const toggleAll = (value: boolean, checkModel: CheckModel) => {
    Object.keys(flatNodes).forEach((key) => {
      const flatNode = flatNodes[key];
      if (checkModel === CheckModel.ALL || (checkModel === CheckModel.LEAF && flatNode?.isLeaf))
        toggleNode(key, "checked", value);
    });
  };

  const toggleParentStatus = (node: ITreeNode, checkModel: CheckModel) => {
    const flatNode = flatNodes?.[node.id as string];

    if (flatNode?.isChild) {
      if (checkModel === CheckModel.ALL) {
        toggleNode(node.id as string, "checked", isEveryChildChecked(flatNode));
      }

      toggleParentStatus(flatNode.parent as ITreeNode, checkModel);
    } else {
      toggleNode(node.id as string, "checked", isEveryChildChecked(flatNode));
    }
  };

  const toggleChecked = (
    node: ITreeNode,
    checkModel: CheckModel,
    isChecked: boolean,
    visited = new Set<string>(),
    percolateUpward = true,
  ) => {
    if (node.disabled || visited.has(node.id as string)) {
      return;
    }

    visited.add(node.id as string);

    // toggle the checked state of all nodes with the same value
    const nodeIds = flatNodesValueIdMap[node.value];
    if (nodeIds) {
      nodeIds.forEach((id) => {
        if (!visited.has(id)) {
          toggleChecked(flatNodes[id], checkModel, isChecked, visited);
        }
      });
    }

    const flatNode = flatNodes?.[node.id as string];

    if (flatNode?.isLeaf) {
      toggleNode(node.id as string, "checked", isChecked);
    } else {
      if (checkModel === CheckModel.ALL || flatNode?.children?.length === 0) {
        toggleNode(node.id as string, "checked", isChecked);
      }

      flatNode.children?.forEach((child) => {
        toggleChecked(child, checkModel, isChecked, visited, false);
      });
    }

    if (percolateUpward && flatNode.isChild && checkModel === CheckModel.ALL) {
      toggleParentStatus(flatNode?.parent as ITreeNode, checkModel);
    }
  };

  return {
    reset,
    flattenNodes,
    deserializeCheckedByValues,
    serializeListToValues,
    getNode,
    toggleChecked,
    getFlatNodes,
    toggleAll,
  };
};
