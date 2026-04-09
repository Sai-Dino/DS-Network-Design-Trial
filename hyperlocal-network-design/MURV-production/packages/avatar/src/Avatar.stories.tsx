import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Person } from "@murv/icons";
import { Avatar } from './components/Avatar';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta: Meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;
export const TextAvatar: Story = {
  args: {
    type: 'text',
    size: 'large',
    badgeProps: {
      children: 30,
      type: "highlight",
    },
  },
  render: (args) => <Avatar {...args}>MU</Avatar>
};

export const ImageAvatar: Story = {
  args: {
    type: 'image',
    size: 'large',
    badgeProps: {
      type: "highlight",
    },
  },
  render: (args) => <Avatar {...args}>
    <img src="https://st.depositphotos.com/2290789/4327/i/950/depositphotos_43274805-stock-illustration-black-panther-head.jpg" alt="panther" />
  </Avatar>
};

export const IconAvatar: Story = {
  args: {
    type: 'icon',
    size: 'large',
    badgeProps: {
      type: "highlight",
    },
  },
  render: (args) => <Avatar {...args}>
    <Person size='25px' />
  </Avatar>
};

export const SubtleBadgeAvatar: Story = {
  args: {
    type: 'image',
    size: 'small',
    badgeProps: {
      type: "highlight",
    },
  },
  render: (args) => <Avatar {...args}>
    <img src="https://st.depositphotos.com/2290789/4327/i/950/depositphotos_43274805-stock-illustration-black-panther-head.jpg" alt="panther" />
  </Avatar>
};
