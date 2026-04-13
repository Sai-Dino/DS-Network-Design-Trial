import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Orientation, Status, IStepperProps, StepPlacement } from "./types";
import { Stepper } from "./Stepper";

const meta = {
  title: "Components/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<IStepperProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StepperStory: Story = {
  args: {
    orientation: Orientation.horizontal,
    color: "#248c2a",
    data: [
      {
        name: "Step One",
        status: Status.completed,
        comments: "12-1-2024 ",
        statusLabel: "Success",
        tagStyle: "success",
      },
      {
        name: "Step Two",
        status: Status.completed,
        comments: "12-1-2024 ",
        statusLabel: "Success",
        tagStyle: "success",
      },
      {
        name: "Step Three",
        status: Status.inProgress,
        comments: "12-1-2024",
        statusLabel: "Pending",
        tagStyle: "pending",
      },
      {
        name: "Step Four",
        status: Status.incomplete,
        comments: "12-1-2024 ",
        statusLabel: "In Complete",
        tagStyle: "grey",
      },
      {
        name: "Step Five",
        status: Status.incomplete,
        comments: "12-1-2024 ",
        statusLabel: "In Complete",
        tagStyle: "grey",
      },
    ],
  },
  parameters: {},
};

export const StepperWithCustomElement: Story = {
  args: {
    orientation: Orientation.horizontal,
    data: [
      {
        name: "Step One",
        status: Status.completed,
        comments: "12-1-2024 ",
        statusLabel: "Success",
        tagStyle: "success",
      },
      {
        name: "Step Two",
        status: Status.completed,
        comments: "12-1-2024 ",
        statusLabel: "Success",
        tagStyle: "success",
      },
      {
        name: "Step Three",
        status: Status.incomplete,
        comments: "12-1-2024 ",
        statusLabel: "In Complete",
        tagStyle: "grey",
        children: <button type="button">Custom Element</button>,
      },
      {
        name: "Step Four",
        status: Status.incomplete,
        comments: "12-1-2024 ",
        statusLabel: "In Complete",
        tagStyle: "grey",
      },
    ],
  },
  parameters: {},
};

export const StepperWithCustomElementAndProgress: Story = {
  args: {
    orientation: Orientation.horizontal,
    data: [
      {
        name: "Step One",
        status: Status.completed,
        children: <button type="button">Custom Element</button>,
      },
      {
        name: "Step Two",
        status: Status.completed,
        children: <button type="button">Custom Element</button>,
      },
      {
        name: "Step Three",
        status: Status.inProgress,
        children: <button type="button">Custom Element</button>,
        progressPercent: 50,
      },
      {
        name: "Step Four",
        status: Status.incomplete,
        children: <button type="button">Custom Element</button>,
      },
    ],
    stepPlacement: StepPlacement.before,
    color: "#ABC8FF",
  },
  parameters: {},
};
