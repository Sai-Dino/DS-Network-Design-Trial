import { CheckboxWithLabel } from "@murv/checkbox";
import { useMURVContext } from "@murv/provider";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { getNodeModel } from "./nodeModel";
import { NodeItem, TreeWrapper } from "./styles";
import { CheckModel, ICheckBoxTreeProps, ITreeNode } from "./types";

export interface CheckBoxTreeRef {
  getModel: () => ReturnType<typeof getNodeModel>;
}

type FlatTreeItem = {
  node: ITreeNode;
  depth: number;
  /** True if any ancestor node has disabled=true (propagated downward) */
  disabled: boolean;
};

/**
 * Flattens a recursive tree into a depth-annotated array of only the nodes
 * that pass `shouldRender`. Preserves depth-first order so items render
 * visually as an indented tree.
 */
const flattenVisibleTree = (
  nodes: ITreeNode[],
  shouldRender: (node: ITreeNode) => boolean,
  depth = 0,
  ancestorDisabled = false,
): FlatTreeItem[] =>
  nodes.filter(shouldRender).reduce<FlatTreeItem[]>((items, node) => {
    const isParent = !!node.children?.length;

    // A parent checkbox is visually disabled when all its direct children are disabled.
    // A leaf is disabled by its own flag or an ancestor's flag.
    const disabled = isParent
      ? node.children!.every((c) => !!c.disabled) || ancestorDisabled
      : !!node.disabled || ancestorDisabled;

    items.push({ node, depth, disabled });

    if (isParent) {
      items.push(
        ...flattenVisibleTree(
          node.children!,
          shouldRender,
          depth + 1,
          // Propagate the node's *own* disabled flag to its descendants
          ancestorDisabled || !!node.disabled,
        ),
      );
    }

    return items;
  }, []);

/**
 * Compares two string arrays by their *set of values* (order-independent,
 * reference-independent). Used to skip unnecessary model re-syncs when a
 * parent form creates a fresh array reference with identical content.
 */
const setsHaveSameElements = (a: string[], b: string[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((v) => setA.has(v));
};

export const CheckBoxTree = React.forwardRef<CheckBoxTreeRef, ICheckBoxTreeProps>(
  ({ id, selected, onSelect, nodes = [], shouldRender, checkModel = "LEAF", dataTestId }, ref) => {
    const { theme } = useMURVContext();
    const prevProps = useRef<{ nodes: ITreeNode[] }>({ nodes });
    const currentSerializedArrays = useRef<{ checked: string[] }>({ checked: [] });
    const scrollRef = useRef<HTMLDivElement>(null);

    const [model, setModel] = useState(() => {
      const newModel = getNodeModel();
      newModel.flattenNodes(nodes);
      newModel.deserializeCheckedByValues({ checked: selected });
      return newModel;
    });

    // ─── Flat list for the virtualizer ───────────────────────────────────────
    // Recomputed only when the visible set of nodes changes (search / showSelected).
    const flatItems = useMemo(() => flattenVisibleTree(nodes, shouldRender), [nodes, shouldRender]);

    const virtualizer = useVirtualizer({
      count: flatItems.length,
      getScrollElement: () => scrollRef.current,
      // Items with a description are slightly taller; estimate so the
      // scroll-bar thumb is reasonably sized before any measurement.
      estimateSize: (index) => (flatItems[index]?.node.description ? 56 : 40),
      overscan: 5,
    });

    // ─── Check-state map (1=checked, 2=indeterminate, 0=unchecked) ───────────
    // Derived purely from `selected` + `nodes` in a single O(n) post-order
    // pass. This replaces the old approach of mutating `flatNode.checkState`
    // during recursive rendering, which broke with virtualization because
    // non-visible parent nodes never got their state computed.
    const checkedSet = useMemo(() => new Set(selected), [selected]);

    const nodeCheckStates = useMemo(() => {
      const states = new Map<string, number>();

      const processNode = (node: ITreeNode): number => {
        const nodeId = node.id as string;
        if (!nodeId) return 0;

        if (!node.children?.length) {
          // Leaf: checked iff its value is in the selected set
          const state = checkedSet.has(node.value) ? 1 : 0;
          states.set(nodeId, state);
          return state;
        }

        // Parent: post-order – process all children first, then derive state
        let someChecked = false;
        let allChecked = node.children.length > 0;

        node.children.forEach((child) => {
          const childState = processNode(child);
          if (childState > 0) someChecked = true;
          if (childState !== 1) allChecked = false;
        });

        let state: number;
        if (allChecked) {
          state = 1;
        } else if (someChecked) {
          state = 2;
        } else {
          state = 0;
        }
        states.set(nodeId, state);
        return state;
      };

      nodes.forEach(processNode);
      return states;
    }, [nodes, checkedSet]);

    // ─── Checkbox change handler (event-delegated on TreeWrapper) ────────────
    const onChangeEvent = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value: nodeId, checked } = e.target;
        const flatNode = model.getNode(nodeId);
        model.toggleChecked(flatNode, CheckModel[checkModel], checked);
        const serializedListItems = model.serializeListToValues();

        let newSelected: string[];
        if (checked) {
          // When checking, combine selected and serializedListItems
          newSelected = [...new Set([...selected, ...serializedListItems])];
        } else {
          // When unchecking, serializeListToValues already reflects the toggled state
          newSelected = serializedListItems;
        }

        currentSerializedArrays.current.checked = newSelected;
        onSelect(newSelected);
      },
      [model, checkModel, selected, onSelect],
    );

    /**
     * Sync the model when `selected` or `nodes` change from outside.
     * Uses set equality instead of reference equality so forms that spread
     * their state (new array reference, same content) don't trigger
     * unnecessary model re-syncs and re-renders.
     */
    useEffect(() => {
      const nodesChanged = prevProps.current.nodes !== nodes;
      const selectedChanged = !setsHaveSameElements(
        selected,
        currentSerializedArrays.current.checked,
      );

      if (selectedChanged || nodesChanged) {
        setModel((prevModel) => {
          const newModel = nodesChanged ? getNodeModel() : prevModel;

          if (nodesChanged) {
            newModel.reset();
            newModel.flattenNodes(nodes);
          }

          newModel.deserializeCheckedByValues({ checked: selected });

          const serializedListItems = newModel.serializeListToValues();
          const combinedSelected = [...new Set([...selected, ...serializedListItems])];
          currentSerializedArrays.current.checked = combinedSelected;

          return newModel;
        });
      }

      prevProps.current.nodes = nodes;
    }, [nodes, selected]);

    useImperativeHandle(ref, () => ({ getModel: () => model }), [model]);

    return (
      <TreeWrapper ref={scrollRef} id={id} onChange={onChangeEvent} data-testid={dataTestId}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const { node, depth, disabled } = flatItems[virtualItem.index];
            const checkState = nodeCheckStates.get(node.id as string) ?? 0;

            return (
              <div
                key={String(virtualItem.key)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                  // (depth + 1) * spacing.s matches the original layout where every
                  // level — including root — had one NodeList adding padding-left: spacing.s,
                  // on top of TreeWrapper's own padding-left: spacing.s. This keeps root
                  // items aligned with the "Select All" checkbox above them.
                  paddingLeft: `calc(${depth + 1} * ${theme.spacing.s})`,
                }}
              >
                <NodeItem>
                  <CheckboxWithLabel
                    id={node.id || `${id}-${node.value}`}
                    label={node.label}
                    // value must be node.id so the delegated change handler can
                    // look up the flat node by id in the model.
                    value={node.id}
                    checked={checkState === 1}
                    inputProps={{
                      // @ts-ignore
                      indeterminate: checkState === 2,
                      readOnly: true,
                    }}
                    description={node.description}
                    disabled={disabled}
                  />
                </NodeItem>
              </div>
            );
          })}
        </div>
      </TreeWrapper>
    );
  },
);
