import { renderHook } from "@testing-library/react-hooks";
import { useSearchSuggestions } from "../src";

describe("Search Suggestions component", () => {
  it("should return the components & values as expected", () => {
    const args = {
      id: "example-id",
      dataTestId: "example-test-id",
      options: [{ text: "Option 1" }, { text: "Option 2" }, { text: "Option 3" }],
      optionsType: "history" as const,
    };
    const { result } = renderHook((props) => useSearchSuggestions(props), {
      initialProps: args,
    });

    expect(result).toBeDefined();
    expect(result.current.length).toBe(2);
    expect(result.current[1].selectedSuggestion).toBe(null);
    expect(result.current[1].closedOption).toBe(null);
  });
});
