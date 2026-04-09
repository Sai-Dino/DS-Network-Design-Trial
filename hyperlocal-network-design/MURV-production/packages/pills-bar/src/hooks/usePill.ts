import { useMemo } from "react";
import { usePillsBarContext } from "../provider/PillsBarProvider";

export const usePill = (value: string) => {
    const { selectedPills, onSelect, isPrefixReplaceable } = usePillsBarContext();

    const state = useMemo(
        () => ({
            isInStack: Array.isArray(selectedPills) ? selectedPills.includes(value) : selectedPills === value,
            isPrefixReplaceable,
            selectedPills
        }),
        [selectedPills, value],
    );
    const actions = {
        onSelect: () => onSelect(value),
    };

    return [state, actions] as const;
};
