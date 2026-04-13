import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { useTheme } from "styled-components";
import { Col } from "./Col";
import { Content } from "./LayoutStory";
import { Root } from "./Root";
import { Row } from "./Row";

const meta: Meta<typeof Row> = {
  title: "Components/Layout",
  component: Row,
  subcomponents: { Col, Root },
  tags: ["autodocs"],
  argTypes: {
    template: { control: "text" },
    gap: { control: "text" },
    backgroundColor: { control: "color" },
  },
};

export default meta;
type Story = StoryObj<typeof Row>;

export const Default: Story = {
  render: (args) => {
    const theme = useTheme();

    return (
      <Row {...args}>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>Col 1</Content>
        </Col>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>Col 2</Content>
        </Col>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>Col 3</Content>
        </Col>
      </Row>
    );
  },
  args: {
    gap: "1em",
  },
};

export const PercentageBased: Story = {
  render: (args) => {
    const theme = useTheme();

    return (
      <Row {...args}>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>20%</Content>
        </Col>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>50%</Content>
        </Col>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>30%</Content>
        </Col>
      </Row>
    );
  },
  args: {
    template: "20% 50% 30%",
    gap: "1em",
  },
};

export const CountBased: Story = {
  render: (args) => {
    const theme = useTheme();

    return (
      <Row {...args}>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>1fr</Content>
        </Col>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>2fr</Content>
        </Col>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>1fr</Content>
        </Col>
      </Row>
    );
  },
  args: {
    template: "1fr 2fr 1fr",
    gap: "1em",
  },
};

export const FixedAndAuto: Story = {
  render: (args) => {
    const theme = useTheme();

    return (
      <Row {...args}>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>100px</Content>
        </Col>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>auto</Content>
        </Col>
      </Row>
    );
  },
  args: {
    template: "100px auto",
    gap: "1em",
  },
};

export const AutoFitMinmax: Story = {
  render: (args) => {
    const theme = useTheme();

    return (
      <Row {...args}>
        {Array.from({ length: 12 }, (_, index) => (
          <Col key={index} backgroundColor={theme.murv.color.surface.success.pressed}>
            <Content>Col {index + 1}</Content>
          </Col>
        ))}
      </Row>
    );
  },
  args: {
    template: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1em",
  },
};
export const JustifyBetween: Story = {
  render: (args) => {
    const theme = useTheme();

    return (
      <Row {...args}>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>auto</Content>
        </Col>
        <Col backgroundColor={theme.murv.color.surface.success.pressed}>
          <Content>auto</Content>
        </Col>
      </Row>
    );
  },
  args: {
    template: "auto auto",
    justifyContent: "space-between",
    gap: "1em",
  },
};

export const WithPadding: Story = {
  render: () => (
    <Row template="1fr 1fr 1fr" gap="1em" backgroundColor="#e8f4f8" padding="10px">
      <Col backgroundColor="#ffcccc" border="2px solid #ff0000">
        <Content>No padding</Content>
      </Col>
      <Col backgroundColor="#ccffcc" padding="20px" border="2px solid #00ff00">
        <Content>With padding (green border shows Col boundary)</Content>
      </Col>
      <Col backgroundColor="#ccccff" padding="40px" border="2px solid #0000ff">
        <Content>More padding (blue border shows Col boundary)</Content>
      </Col>
    </Row>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the `padding` prop on Col components. Light blue background shows Row boundary, colored borders show Col boundaries, and padding creates space inside each Col.",
      },
    },
  },
};

export const WithMargin: Story = {
  render: () => (
    <div style={{ backgroundColor: "#f0f0f0", padding: "20px" }}>
      <Row template="1fr 1fr 1fr" gap="1em" backgroundColor="#e8f4f8" padding="10px">
        <Col backgroundColor="#ffcccc" margin="0" border="2px solid #ff0000">
          <Content>No margin (red border)</Content>
        </Col>
        <Col backgroundColor="#ccffcc" margin="20px" border="2px solid #00ff00">
          <Content>With margin (green border shows Col, gray space outside is margin)</Content>
        </Col>
        <Col backgroundColor="#ccccff" margin="40px" border="2px solid #0000ff">
          <Content>More margin (blue border shows Col, gray space outside is margin)</Content>
        </Col>
      </Row>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the `margin` prop on Col components. Light blue background shows Row boundary, colored borders show Col boundaries, and gray space around Cols shows margin.",
      },
    },
  },
};

export const WithPosition: Story = {
  render: () => (
    <Row
      template="1fr 1fr"
      gap="1em"
      backgroundColor="#e8f4f8"
      padding="20px"
      border="3px solid #0066cc"
    >
      <Col backgroundColor="#ffcccc" position="relative" border="2px solid #ff0000" padding="15px">
        <Content>Relative position (red border = Col boundary)</Content>
      </Col>
      <Col backgroundColor="#ccffcc" position="relative" border="2px solid #00ff00" padding="15px">
        <Content>Relative position (green border = Col boundary)</Content>
      </Col>
    </Row>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the `position` prop on Col components. Blue border shows Row boundary, colored borders show Col boundaries, and padding creates space inside each Col.",
      },
    },
  },
};

export const WithOverflow: Story = {
  render: () => (
    <Row
      template="1fr 1fr"
      gap="1em"
      backgroundColor="#e8f4f8"
      padding="20px"
      border="3px solid #0066cc"
    >
      <div style={{ maxHeight: "100px" }}>
        <Col backgroundColor="#ffcccc" overflow="hidden" border="2px solid #ff0000" padding="10px">
          <Content>
            This is a long content that will overflow. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Content>
        </Col>
      </div>
      <div style={{ maxHeight: "100px" }}>
        <Col backgroundColor="#ccffcc" overflow="scroll" border="2px solid #00ff00" padding="10px">
          <Content>
            This content has scroll overflow. Lorem ipsum dolor sit amet, consectetur adipiscing
            elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Content>
        </Col>
      </div>
    </Row>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the `overflow` prop on Col components. Blue border shows Row boundary, colored borders show Col boundaries. Left: overflow hidden, Right: overflow scroll.",
      },
    },
  },
};

export const ColWithDisplay: Story = {
  render: () => {
    const theme = useTheme();

    return (
      <Row template="1fr 1fr" gap="1em">
        <Col backgroundColor={theme.murv.color.surface.success.pressed} display="flex">
          <Content>Display: flex</Content>
        </Col>
        <Col backgroundColor={theme.murv.color.surface.success.pressed} display="grid">
          <Content>Display: grid</Content>
        </Col>
      </Row>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the `display` prop on Col components to override the default grid display.",
      },
    },
  },
};

export const ColWithJustifyContent: Story = {
  render: () => {
    const theme = useTheme();

    return (
      <Row template="1fr 1fr 1fr" gap="1em">
        <Col
          backgroundColor={theme.murv.color.surface.success.pressed}
          justifyContent="flex-start"
          display="flex"
        >
          <Content>flex-start</Content>
        </Col>
        <Col
          backgroundColor={theme.murv.color.surface.success.pressed}
          justifyContent="center"
          display="flex"
        >
          <Content>center</Content>
        </Col>
        <Col
          backgroundColor={theme.murv.color.surface.success.pressed}
          justifyContent="flex-end"
          display="flex"
        >
          <Content>flex-end</Content>
        </Col>
      </Row>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates the `justifyContent` prop on Col components.",
      },
    },
  },
};

export const ColWithAlignItems: Story = {
  render: () => {
    const theme = useTheme();

    return (
      <Row template="1fr 1fr 1fr" gap="1em">
        <div style={{ height: "150px" }}>
          <Col
            backgroundColor={theme.murv.color.surface.success.pressed}
            alignItems="flex-start"
            display="flex"
          >
            <Content>flex-start</Content>
          </Col>
        </div>
        <div style={{ height: "150px" }}>
          <Col
            backgroundColor={theme.murv.color.surface.success.pressed}
            alignItems="center"
            display="flex"
          >
            <Content>center</Content>
          </Col>
        </div>
        <div style={{ height: "150px" }}>
          <Col
            backgroundColor={theme.murv.color.surface.success.pressed}
            alignItems="flex-end"
            display="flex"
          >
            <Content>flex-end</Content>
          </Col>
        </div>
      </Row>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates the `alignItems` prop on Col components.",
      },
    },
  },
};

export const ColWithGridTemplateRows: Story = {
  render: () => {
    const theme = useTheme();

    return (
      <Row template="1fr 1fr" gap="1em">
        <Col
          backgroundColor={theme.murv.color.surface.success.pressed}
          gridTemplateRows="auto 1fr auto"
        >
          <Content>Header</Content>
          <Content>Content</Content>
          <Content>Footer</Content>
        </Col>
        <Col
          backgroundColor={theme.murv.color.surface.success.pressed}
          gridTemplateRows="repeat(3, 1fr)"
        >
          <Content>Row 1</Content>
          <Content>Row 2</Content>
          <Content>Row 3</Content>
        </Col>
      </Row>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates the `gridTemplateRows` prop on Col components.",
      },
    },
  },
};

export const ColWithGridTemplateColumns: Story = {
  render: () => {
    const theme = useTheme();

    return (
      <Row template="1fr" gap="1em">
        <Col
          backgroundColor={theme.murv.color.surface.success.pressed}
          gridTemplateColumns="1fr 2fr 1fr"
        >
          <Content>1fr</Content>
          <Content>2fr</Content>
          <Content>1fr</Content>
        </Col>
      </Row>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the `gridTemplateColumns` prop on Col components to create nested grids.",
      },
    },
  },
};

export const RowWithPadding: Story = {
  render: () => (
    <div style={{ backgroundColor: "#d0d0d0", padding: "10px" }}>
      <Row
        template="1fr 1fr 1fr"
        gap="1em"
        padding="20px"
        backgroundColor="#e8f4f8"
        border="3px solid #0066cc"
      >
        <Col backgroundColor="#ffcccc" border="2px solid #ff0000" padding="10px">
          <Content>Col 1</Content>
        </Col>
        <Col backgroundColor="#ccffcc" border="2px solid #00ff00" padding="10px">
          <Content>Col 2</Content>
        </Col>
        <Col backgroundColor="#ccccff" border="2px solid #0000ff" padding="10px">
          <Content>Col 3</Content>
        </Col>
      </Row>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the `padding` prop on Row component. Gray background shows outer container, blue border shows Row boundary with padding inside, colored borders show Col boundaries.",
      },
    },
  },
};

export const RowWithMargin: Story = {
  render: () => (
    <div style={{ backgroundColor: "#d0d0d0", padding: "10px" }}>
      <Row
        template="1fr 1fr"
        gap="1em"
        margin="20px"
        backgroundColor="#e8f4f8"
        border="3px solid #0066cc"
        padding="15px"
      >
        <Col backgroundColor="#ffcccc" border="2px solid #ff0000" padding="10px">
          <Content>Col 1</Content>
        </Col>
        <Col backgroundColor="#ccffcc" border="2px solid #00ff00" padding="10px">
          <Content>Col 2</Content>
        </Col>
      </Row>
      <div
        style={{ marginTop: "10px", padding: "5px", backgroundColor: "#fff9c4", fontSize: "12px" }}
      >
        Gray space around blue border = Row margin (20px)
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the `margin` prop on Row component. Gray background shows outer container, gray space around blue border shows Row margin, blue border shows Row boundary, colored borders show Col boundaries.",
      },
    },
  },
};

export const RowWithOverflow: Story = {
  render: () => {
    const theme = useTheme();

    return (
      <div style={{ maxHeight: "300px" }}>
        <Row template="repeat(auto-fit, minmax(200px, 1fr))" gap="1em" overflow="auto">
          {Array.from({ length: 20 }, (_, index) => (
            <Col key={index} backgroundColor={theme.murv.color.surface.success.pressed}>
              <Content>Col {index + 1}</Content>
            </Col>
          ))}
        </Row>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates the `overflow` prop on Row component with scrollable content.",
      },
    },
  },
};

export const RowWithJustifyItems: Story = {
  render: () => {
    const theme = useTheme();

    return (
      <Row template="repeat(2, 1fr)" gap="1em" justifyItems="center">
        <div style={{ width: "100px" }}>
          <Col backgroundColor={theme.murv.color.surface.success.pressed}>
            <Content>Small</Content>
          </Col>
        </div>
        <div style={{ width: "100px" }}>
          <Col backgroundColor={theme.murv.color.surface.success.pressed}>
            <Content>Small</Content>
          </Col>
        </div>
      </Row>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates the `justifyItems` prop on Row component to align grid items.",
      },
    },
  },
};

// Root Component Stories
type RootStory = StoryObj<typeof Root>;

export const RootDefault: RootStory = {
  render: () => (
    <div style={{ backgroundColor: "#d0d0d0", padding: "10px" }}>
      <div style={{ backgroundColor: "#f5f5f5", border: "4px solid #0066cc", padding: "10px" }}>
        <Root gap="1em">
          <Row backgroundColor="#ffcccc" padding="20px" border="2px solid #ff0000">
            <Content>Header Section (red border = Row boundary)</Content>
          </Row>
          <Row backgroundColor="#ccffcc" padding="20px" border="2px solid #00ff00">
            <Content>Main Content Section (green border = Row boundary)</Content>
          </Row>
          <Row backgroundColor="#ccccff" padding="20px" border="2px solid #0000ff">
            <Content>Footer Section (blue border = Row boundary)</Content>
          </Row>
        </Root>
      </div>
      <div
        style={{ marginTop: "10px", padding: "5px", backgroundColor: "#fff9c4", fontSize: "12px" }}
      >
        Blue border = Root boundary, Colored borders = Row boundaries, Gray space = Root gap
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Basic Root component demonstrating vertical grid layout with header, content, and footer sections. Blue border shows Root boundary, colored borders show Row boundaries, and gray space shows gap between rows.",
      },
    },
  },
};

export const RootWithGridTemplateRows: RootStory = {
  render: () => (
    <div style={{ backgroundColor: "#d0d0d0", padding: "10px" }}>
      <div style={{ backgroundColor: "#f5f5f5", border: "4px solid #0066cc", padding: "10px" }}>
        <Root gridTemplateRows="auto 1fr auto" height="400px" gap="1em">
          <Row backgroundColor="#ffcccc" padding="20px" border="2px solid #ff0000">
            <Content>Fixed Header (auto height) - Red border</Content>
          </Row>
          <Row backgroundColor="#ccffcc" padding="20px" border="2px solid #00ff00">
            <Content>Flexible Main Content (takes remaining space) - Green border</Content>
          </Row>
          <Row backgroundColor="#ccccff" padding="20px" border="2px solid #0000ff">
            <Content>Fixed Footer (auto height) - Blue border</Content>
          </Row>
        </Root>
      </div>
      <div
        style={{ marginTop: "10px", padding: "5px", backgroundColor: "#fff9c4", fontSize: "12px" }}
      >
        Blue border = Root boundary, Middle section expands to fill space (1fr)
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Root component with custom `gridTemplateRows` to create a layout with fixed header/footer and flexible middle section. Blue border shows Root boundary, colored borders show Row boundaries.",
      },
    },
  },
};

export const RootWithHeight: RootStory = {
  render: () => (
    <div style={{ backgroundColor: "#d0d0d0", padding: "10px" }}>
      <div style={{ backgroundColor: "#f5f5f5", border: "4px solid #0066cc", padding: "10px" }}>
        <Root height="300px" gap="0.5em">
          <Row backgroundColor="#ffcccc" padding="15px" border="2px solid #ff0000">
            <Content>Section 1</Content>
          </Row>
          <Row backgroundColor="#ccffcc" padding="15px" border="2px solid #00ff00">
            <Content>Section 2</Content>
          </Row>
          <Row backgroundColor="#ccccff" padding="15px" border="2px solid #0000ff">
            <Content>Section 3</Content>
          </Row>
          <Row backgroundColor="#ffccff" padding="15px" border="2px solid #ff00ff">
            <Content>Section 4</Content>
          </Row>
        </Root>
      </div>
      <div
        style={{ marginTop: "10px", padding: "5px", backgroundColor: "#fff9c4", fontSize: "12px" }}
      >
        Blue border = Root boundary (300px height), Content scrolls if it exceeds height
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Root component with fixed `height` and `overflow: auto` for scrollable content. Blue border shows Root boundary, colored borders show Row boundaries.",
      },
    },
  },
};

export const RootWithWidth: RootStory = {
  render: (args) => {
    const theme = useTheme();

    return (
      <div style={{ border: "2px dashed #ccc", padding: "20px" }}>
        <Root {...args}>
          <Row backgroundColor={theme.murv.color.surface.success.pressed} padding="20px">
            <Content>Narrow Root Container</Content>
          </Row>
          <Row backgroundColor={theme.murv.color.surface.success.pressed} padding="20px">
            <Content>Width: 50%</Content>
          </Row>
        </Root>
      </div>
    );
  },
  args: {
    width: "50%",
    gap: "1em",
  },
  parameters: {
    docs: {
      description: {
        story: "Root component with custom `width` instead of default 100%.",
      },
    },
  },
};

export const RootFullPageLayout: RootStory = {
  render: (args) => {
    const theme = useTheme();

    return (
      <Root {...args}>
        <Row
          backgroundColor={theme.murv.color.surface.success.pressed}
          padding="15px"
          template="1fr auto"
          alignItems="center"
        >
          <Col>
            <Content>Logo</Content>
          </Col>
          <Col>
            <Content>Navigation</Content>
          </Col>
        </Row>
        <Row backgroundColor={theme.murv.color.surface.success.pressed} padding="40px">
          <Col>
            <Content>Main Content Area</Content>
            <div style={{ marginTop: "20px" }}>
              <Content>
                This is a full-page layout example with header, main content, and footer.
              </Content>
            </div>
          </Col>
        </Row>
        <Row backgroundColor={theme.murv.color.surface.success.pressed} padding="15px">
          <Content>Footer © 2024</Content>
        </Row>
      </Root>
    );
  },
  args: {
    gridTemplateRows: "auto 1fr auto",
    height: "100vh",
    gap: "0",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Complete full-page layout example using Root component with header, main content, and footer sections.",
      },
    },
  },
};

export const RootWithMultipleRows: RootStory = {
  render: (args) => {
    const theme = useTheme();

    return (
      <Root {...args}>
        <Row backgroundColor={theme.murv.color.surface.success.pressed} padding="15px">
          <Content>Row 1</Content>
        </Row>
        <Row backgroundColor={theme.murv.color.surface.success.pressed} padding="15px">
          <Content>Row 2</Content>
        </Row>
        <Row backgroundColor={theme.murv.color.surface.success.pressed} padding="15px">
          <Content>Row 3</Content>
        </Row>
        <Row backgroundColor={theme.murv.color.surface.success.pressed} padding="15px">
          <Content>Row 4</Content>
        </Row>
        <Row backgroundColor={theme.murv.color.surface.success.pressed} padding="15px">
          <Content>Row 5</Content>
        </Row>
      </Root>
    );
  },
  args: {
    gridTemplateRows: "repeat(5, 1fr)",
    height: "500px",
    gap: "1em",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Root component with multiple rows using `repeat()` function for equal-height sections.",
      },
    },
  },
};
