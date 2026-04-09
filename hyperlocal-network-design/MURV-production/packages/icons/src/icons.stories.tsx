// eslint-disable-next-line check-file/filename-naming-convention
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
    title: "Components/Icons",
    component: '',
    tags: ["autodocs"],
    parameters: {
        docs: {
            source: {
                code: null,
            },
        },
    }
} as Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Icon: Story = {
    args: {},
    render: () => (<a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer">Icon Library Referance</a>)
};

Icon.argTypes = {};
