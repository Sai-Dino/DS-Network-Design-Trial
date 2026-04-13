import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import styled from "styled-components";
import Connector from "./Connector";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction

const meta = {
  title: "Components/Connector",
  component: Connector,
  tags: ["autodocs"],
} satisfies Meta<typeof Connector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ConnectorStoryWithoutDefaultProps: Story = {
  args: {},
  render: (args) => (
    <div data-testid="connector-storybook-ui-container">
      <Connector {...args} />
    </div>
  ),
};

export const ConnectorStoryWithProps: Story = {
  args: {
    height: "32px",
    width: "16px",
  },
  render: (args) => (
    <div data-testid="connector-storybook-ui-container">
      <div
        style={{
          border: "1px solid black",
          padding: "4px",
          width: "fit-content",
          fontSize: "10px",
        }}
      >
        Parent
      </div>
      <div style={{ display: "flex" }}>
        <Connector {...args} />
        <div
          style={{
            border: "1px solid black",
            padding: "4px",
            width: "fit-content",
            marginTop: "20px",
            fontSize: "10px",
          }}
        >
          Child
        </div>
      </div>
    </div>
  ),
};

export const ConnectorStoryWithOrientation: Story = {
  args: {
    height: "32px",
    width: "16px",
    orientation: "right",
  },
  render: (args) => (
    <div data-testid="connector-storybook-ui-container">
      <div
        style={{
          border: "1px solid black",
          padding: "4px",
          width: "fit-content",
          fontSize: "10px",
          marginLeft: "20px",
        }}
      >
        Parent
      </div>
      <div style={{ display: "flex" }}>
        <div
          style={{
            border: "1px solid black",
            padding: "4px",
            width: "fit-content",
            marginTop: "20px",
            fontSize: "10px",
          }}
        >
          Child
        </div>
        <Connector {...args} />
      </div>
    </div>
  ),
};

const ConnectorWrapper = styled.div`
  position: relative;
  .connector-story {
    position: absolute;
    top: -10px;
  }
`;

export const ConnectorStoryWithMultipleChild: Story = {
  args: {
    height: "32px",
    width: "16px",
  },
  render: (args) => (
    <div data-testid="connector-storybook-ui-container">
      <div
        style={{
          border: "1px solid black",
          padding: "4px",
          width: "fit-content",
          fontSize: "10px",
        }}
      >
        Parent
      </div>
      <div style={{ display: "flex" }}>
        <Connector {...args} />
        <div
          style={{
            border: "1px solid black",
            padding: "4px",
            width: "fit-content",
            marginTop: "20px",
            fontSize: "10px",
          }}
        >
          Child
        </div>
      </div>
      <ConnectorWrapper style={{ display: "flex" }}>
        <Connector {...args} className="connector-story" />
        <div
          style={{
            border: "1px solid black",
            padding: "4px",
            width: "fit-content",
            marginTop: "10px",
            fontSize: "10px",
            marginLeft: "16px",
          }}
        >
          Child
        </div>
      </ConnectorWrapper>
    </div>
  ),
};
