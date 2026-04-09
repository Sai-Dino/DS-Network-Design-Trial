import React from "react";
import { render as rtlRender, RenderOptions, RenderResult } from "@testing-library/react";
import { MURVProvider } from "@murv/provider";

interface CustomRenderOptions extends RenderOptions {}

function customRender(ui: React.ReactElement, options?: CustomRenderOptions): RenderResult {
  const Wrapper: React.FC = ({ children }) => {
    let renderedChildren = children;
    const { wrapper: PassedWrapper } = options ?? {};
    if (PassedWrapper) {
      renderedChildren = (
        <PassedWrapper>
          {/** @ts-ignore */}
          {children}
        </PassedWrapper>
      );
    }
    return <MURVProvider themeVariant="light">{renderedChildren}</MURVProvider>;
  };

  return rtlRender(ui, { ...options, wrapper: Wrapper });
}

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
