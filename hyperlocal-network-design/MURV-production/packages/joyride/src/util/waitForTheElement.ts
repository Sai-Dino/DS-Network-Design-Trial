// waits and run a callback function when the given target is in document body
export async function waitForTheElement(
  target: { query: string; [key: string]: any }[],
  callback: (callbackProps: {
    observer: MutationObserver;
    query: string;
    element: HTMLElement;
    allElementFound?: boolean;
    [key: string]: any;
  }) => void,
) {
  const observeAElement = async () =>
    new Promise<void>((resolve) => {
      const foundElements = [];
      const observer = new MutationObserver(() => {
        target.forEach((item) => {
          const element: HTMLElement | null = document.querySelector(item.query);
          if (element) {
            // Element is found in the document body
            // Perform your actions here if needed
            callback({
              ...item,
              element,
              query: item.query,
              observer,
              allElementFound: foundElements.length === target.length,
            });
            foundElements.push(target);
          }
        });
      });
      if (foundElements.length === target.length) {
        observer.disconnect();
        resolve();
      }

      // Start observing the DOM for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });

  // Start observing the DOM
  observeAElement();
}
