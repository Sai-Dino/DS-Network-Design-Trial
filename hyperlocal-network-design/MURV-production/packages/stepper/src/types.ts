import { ReactChild } from "react";

export enum Orientation {
  horizontal = "horizontal",
  vertical = "vertical",
}
export enum StepPosition {
  start = "start",
  middle = "middle",
  end = "end",
}

export enum Status {
  completed = "completed",
  inProgress = "inProgress",
  incomplete = "incomplete",
}

export enum StepPlacement {
  before = "before",
  after = "after",
}

export type IProgressPercent = number;

export interface IProgressBarStylesProps {
  progressPercent: IProgressPercent;
}

export interface IStepData {
  name: string;
  status: keyof typeof Status;
  comments?: string;
  statusLabel?: string;
  tagStyle?: ITagStyle;
  children?: ReactChild;
  progressPercent?: IProgressPercent;
}

export interface IStepProps {
  orientation: keyof typeof Orientation;
  data: IStepData;
  position: keyof typeof StepPosition;
  testId?: string;
  stepColor?: string;
  stepPlacement?: keyof typeof StepPlacement;
}

export type ITagStyle =
  | "red"
  | "yellow"
  | "green"
  | "black"
  | "grey"
  | "success"
  | "submitted"
  | "rejected"
  | "pending"
  | "expired";

export interface IStepperProps {
  orientation: keyof typeof Orientation;
  data: IStepData[];
  testId?: string;
  color?: string;
  stepPlacement?: keyof typeof StepPlacement;
}

export interface IStepperStylesProps {
  orientation?: keyof typeof Orientation;
  status?: keyof typeof Status;
  stepColor?: string;
  stepPlacement?: keyof typeof StepPlacement;
}
