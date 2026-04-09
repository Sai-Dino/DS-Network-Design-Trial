import { useEffect } from "react";
import throttle from "lodash.throttle";

/**
 * Observes resize events on the window
 * @param onResize - callback to be called when the window is resizeds
 */
export function useResize(onResize: () => void) {
  useEffect(() => {
    // Considering the fact that the resize event can be triggered at a high rate, the event handler shouldn't execute computationally expensive operations such as DOM manipulations.
    const throttledResize = throttle(onResize, 300, { leading: false, trailing: true });
    window.addEventListener("resize", throttledResize, false);
    return () => {
      window.removeEventListener("resize", throttledResize, false);
    };
  }, [onResize]);
}
