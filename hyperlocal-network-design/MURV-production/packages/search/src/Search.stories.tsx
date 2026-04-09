import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, ReactElement, useRef, useEffect, RefObject } from "react";
import { Search } from "./Search";
import { RefType } from "./types";

interface ParentProps {
  render: (
    handler?: (query: string, id: string) => void,
    onReset?: (query: string, id: string) => void,
    ref?: RefObject<RefType | null>,
  ) => ReactElement;
}

const Parent: React.FC<ParentProps> = ({ render }) => {
  const [searchMeta, setSearchMeta] = useState({ id: "", query: "" });
  const ref = useRef<RefType>(null);

  const handler = (query: string, id: string) => {
    setSearchMeta({ query, id });
  };
  useEffect(() => {
    if (ref?.current) {
      ref.current?.focus();
    }
  }, []);
  return (
    <>
      {render(handler, ref)}
      <div style={{ marginTop: "32px" }}>
        In Parent component :: Search Triggered for ID : {searchMeta.id || "--"} with query :{" "}
        {searchMeta.query || "--"}
      </div>
    </>
  );
};

const Parent2: React.FC<ParentProps> = ({ render }) => {
  const [searchMeta, setSearchMeta] = useState({ id: "", query: "" });
  const ref = useRef<RefType>(null);

  const handler = (query: string, id: string) => {
    setSearchMeta({ query, id });
  };

  const onClick = () => {
    if (ref.current) {
      ref.current?.clear();
    }
  };
  return (
    <>
      {render(handler, ref)}
      <div style={{ marginTop: "32px" }}>
        In Parent component :: Search Triggered for ID : {searchMeta.id || "--"} with query :{" "}
        {searchMeta.query || "--"}
      </div>
      <div style={{ marginTop: "32px" }}>
        <button type="button" onClick={onClick}>
          Click to clear the query
        </button>
      </div>
    </>
  );
};

const meta = {
  title: "Components/Search",
  component: Search,
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Search>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper map to allow choosing different suffix functions via Storybook controls
const suffixOptions = {
  none: undefined,
  shortcut: () => <span>Shortcut /</span>,
  hello: () => <span>Hello /</span>,
  button: () => <button type="button">Action</button>,
  button2: () => (
    <div style={{ backgroundColor: "red", padding: "3px", borderRadius: "5px" }}>Action 2</div>
  ),
};

export const onSearchTrigger: Story = {
  args: {
    id: "mySearch1",
    placeholder: "Enter a value",
    disabled: false,
  },
  render: (args) => <Parent render={(handler) => <Search {...args} onSearch={handler} />} />,
};

export const onChangeWithDefaultDebounce: Story = {
  args: {
    id: "mySearch2",
    placeholder: "Enter a value",
    disabled: false,
  },
  render: (args) => <Parent render={(handler) => <Search {...args} onChange={handler} />} />,
};

export const Disabled: Story = {
  args: {
    id: "mySearch3",
    placeholder: "Enter a value",
    disabled: true,
    initialQuery: "",
  },
  render: (args) => <Parent render={(handler) => <Search {...args} onSearch={handler} />} />,
};

export const InitialQuery: Story = {
  args: {
    id: "mySearch4",
    placeholder: "Enter a value",
    initialQuery: "Flipkart",
  },
  render: (args) => <Parent render={(handler) => <Search {...args} onSearch={handler} />} />,
};

export const DisabledWithInitialQuery: Story = {
  args: {
    id: "mySearch5",
    placeholder: "Enter a value",
    disabled: true,
    initialQuery: "Flipkart",
  },
  render: (args) => <Parent render={(handler) => <Search {...args} onSearch={handler} />} />,
};

export const FocusUsingRef: Story = {
  args: {
    id: "mySearch5",
    placeholder: "Enter a value",
  },
  render: (args) => (
    <Parent render={(handler, ref) => <Search {...args} ref={ref} onSearch={handler} />} />
  ),
};
export const ClearUsingRef: Story = {
  args: {
    id: "mySearch5",
    placeholder: "Enter a value",
    initialQuery: "Flipkart",
  },
  render: (args) => (
    <Parent2 render={(handler, ref) => <Search {...args} ref={ref} onSearch={handler} />} />
  ),
};

export const SuffixViaControls: Story = {
  args: {
    id: "mySearchWithSuffixControls",
    placeholder: "Search Where is Rate Card",
    disabled: false,
    prefixIcon: true,
    // Story-only arg to choose which function to pass
    suffixVariant: "shortcut",
  } as any,
  argTypes: {
    suffixVariant: {
      options: Object.keys(suffixOptions),
      control: { type: "select" },
    },
  },
  render: (args: any) => {
    const { suffixVariant, ...rest } = args;
    const suffixFn = suffixOptions[suffixVariant as keyof typeof suffixOptions];
    return (
      <Parent
        render={(handler) => (
          <Search {...(rest as any)} onSearch={handler} renderSuffix={suffixFn} />
        )}
      />
    );
  },
};
const ParentWithReset: React.FC<ParentProps> = ({ render }) => {
  const [resetMeta, setResetMeta] = useState({ id: "", query: "" });
  const ref = useRef<RefType>(null);

  const onReset = (query: string, id: string) => {
    setResetMeta({ query, id });
  };

  return (
    <>
      {render(undefined, onReset, ref)}
      <div style={{ marginTop: "32px" }}>
        <strong>onReset Triggered:</strong> ID: {resetMeta.id || "--"} | Query:{" "}
        {resetMeta.query || "--"}
      </div>
    </>
  );
};

export const OnReset: Story = {
  args: {
    id: "mySearchReset",
    placeholder: "Enter a value",
    initialQuery: "Reset me!",
  },
  render: (args) => (
    <ParentWithReset
      render={(_handler, onReset, ref) => <Search {...args} ref={ref} onReset={onReset} />}
    />
  ),
};
