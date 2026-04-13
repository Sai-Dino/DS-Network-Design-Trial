import { useMemo } from "react";
import { generateRandomId } from "@murv/core/utils/generate-random-id";

export const useId = () => useMemo(() => generateRandomId(), []);
