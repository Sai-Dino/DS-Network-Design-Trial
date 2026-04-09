import type { Preview } from "@storybook/react";
import React from "react";
import { MURVProvider } from "../packages/provider/src";
import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";

const customViewports = {
  small: {
    name: "Small devices (landscape phones, 576px and up)",
    styles: {
      width: "576px",
      height: "800px",
    },
  },
  medium: {
    name: "Medium devices (tablets, 768px and up)",
    styles: {
      width: "768px",
      height: "801px",
    },
  },
  large: {
    name: "Large devices (desktops, 992px and up)",
    styles: {
      width: "992px",
      height: "801px",
    },
  },
  xLarge: {
    name: "X-Large devices (large desktops, 1200px and up)",
    styles: {
      width: "1200px",
      height: "801px",
    },
  },
  xxLarge: {
    name: "XX-Large devices (larger desktops, 1400px and up)",
    styles: {
      width: "1200px",
      height: "801px",
    },
  },
};

const preview: Preview = {
  globalTypes: {
    tenant: {
      description: "Tenant for the application",
      defaultValue: "Flipkart",
      toolbar: {
        title: "Tenant",
        items: ["Flipkart", "Makro"], // Add more tenants here
        dynamicTitle: true,
        icon: "globe",
      },
    },
    themeVariant: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        // The label to show for this toolbar item
        title: "Theme",
        // icon: 'circlehollow',
        // Array of plain string values or MenuItem shape (see below)
        items: [
          {
            value: "light",
            icon: "sun",
            title: "Light",
          },
          {
            value: "dark",
            icon: "moon",
            title: "Dark",
          },
        ],
        // Change title based on selected value
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    viewport: {
      viewports: { ...customViewports, ...MINIMAL_VIEWPORTS },
    },
  },
};

export const decorators = [
  (Story, context) => (
    <React.StrictMode>
      <MURVProvider themeVariant={context.globals.themeVariant} tenant={context.globals.tenant}>
        <Story />
      </MURVProvider>
    </React.StrictMode>
  ),
];

export default preview;
