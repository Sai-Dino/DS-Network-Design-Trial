import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Upload } from "./Upload";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction

const meta = {
  title: "Components/Upload",
  component: Upload,
  tags: ["autodocs"],
  render: (args) => (
    <div data-testid="upload-storybook-ui-container">
      <Upload {...args} />
    </div>
  ),
} satisfies Meta<typeof Upload>;

export default meta;

type Story = StoryObj<typeof meta>;

export const UploadSuccess: Story = {
  args: {
    dataTestId: "upload-01",
    id: "upload-01",
    multiple: true,
    accept: "image/*",
    uploadText: {
      beforeUploadText: "Select the file to upload",
      doUploadText: "Upload selected file",
      uploadingText: "Uploading selected file...",
      uploadSuccessText: "Upload successful!",
      uploadFailedText: "Upload Failed!",
    },
    templateProps: {
      actionLabel: "Don’t have the template?",
      templateText: "Download",
      onTemplateDownload: () => {},
    },
    onSelection: (files: FileList) => {
      console.log(files);
    },
    onUploadingCancel: () => {},
    onUpload: () =>
      new Promise((resolve) => {
        setTimeout(() => resolve("SUCCESS"), 1500);
      }),
  },
  render: (args) => (
    <div data-testid="upload-storybook-ui-container">
      <Upload {...args} />
    </div>
  ),
};

export const AutoUploadSuccess: Story = {
  args: {
    dataTestId: "upload-01",
    id: "upload-01",
    multiple: false,
    accept: "image/*",
    uploadText: {
      beforeUploadText: "Select the file to upload",
      doUploadText: "Upload selected file",
      uploadingText: "Uploading selected file...",
      uploadSuccessText: "Upload successful!",
      uploadFailedText: "Upload Failed!",
    },
    templateProps: {
      actionLabel: "Don’t have the template?",
      templateText: "Download",
      onTemplateDownload: () => {},
    },
    onSelection: (files: FileList) => {
      console.log(files);
    },
    onUploadingCancel: () => {},
    autoUpload: true,
    onUpload: () =>
      new Promise((resolve) => {
        setTimeout(() => resolve("SUCCESS"), 1500);
      }),
  },
  render: (args) => (
    <div data-testid="upload-storybook-ui-container">
      <Upload {...args} />
    </div>
  ),
};

export const UploadFailed: Story = {
  args: {
    dataTestId: "upload-failed",
    id: "upload-failed-01",
    multiple: false,
    accept: "image/*",
    onSelection: (files: FileList) => {
      console.log(files);
    },
    onUploadingCancel: () => {},
    onUpload: () =>
      new Promise((resolve) => {
        setTimeout(() => resolve("FAILED"), 1500);
      }),
  },
  render: (args) => (
    <div data-testid="upload-storybook-ui-container">
      <Upload {...args} />
    </div>
  ),
};
