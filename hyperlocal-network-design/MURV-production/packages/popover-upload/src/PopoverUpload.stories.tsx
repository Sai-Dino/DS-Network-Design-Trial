import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from 'react';
import { PopoverUpload } from "./PopoverUpload";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction

const meta = {
  title: "Components/PopoverUpload",
  component: PopoverUpload,
  tags: ["autodocs"],
} satisfies Meta<typeof PopoverUpload>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PopoverUploadSuccess: Story = {
  args: {
    dataTestId: "test",
    id: 'popover-upload',
    multiple: false,
    accept: 'image/*',
    uploadText: {
      beforeUploadText: 'Select the file to upload',
      doUploadText: 'Upload selected file',
      uploadingText: 'Uploading selected file...',
      uploadSuccessText: 'Upload successful!',
      uploadFailedText: 'Upload Failed!'
    },
    templateProps: {
      actionLabel: "Don’t have the template?",
      templateText: 'Download',
      onTemplateDownload: () => {}
    },
    onSelection: (files: FileList) => { console.log(files)},
    onUploadingCancel: () => {},
    onUpload: () => new Promise(resolve => {setTimeout(() => resolve('SUCCESS'), 1500)}),
    headerText: 'Bulk Consignment Schedule',
    popoverAction: 'click',
    popoverPosition: 'bottom-right',
    showBack: true,
    showCancel: true,
  },
  render: (args) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
    return (
      <PopoverUpload 
        {...args} 
        isPopoverOpen={isPopoverOpen} 
        renderTarget={(props) => (
          <button {...props} style={{ padding: "4px" }} type="button" onClick={() => setIsPopoverOpen(true)}>
            Target
          </button>
        )} 
        onVisibilityChange={(value) => setIsPopoverOpen(value)} 
        onClose={() => setIsPopoverOpen(false)} 
        offset={{ x: 5, y: 10 }} 
      />
    )
  },
};

export const PopoverUploadFailed: Story = {
  args: {
    dataTestId: "test",
    id: 'popover-upload',
    multiple: false,
    accept: 'image/*',
    templateProps: {
      actionLabel: "Don’t have the template?",
      templateText: 'Download',
      onTemplateDownload: () => {}
    },
    onSelection: (files: FileList) => { console.log(files)},
    onUploadingCancel: () => {},
    onUpload: () => new Promise(resolve => {setTimeout(() => resolve('FAILED'), 1500)}),
    headerText: 'Bulk Consignment Update',
    popoverAction: 'click',
    popoverPosition: 'bottom-right',
    showBack: true,
    offset: { x: 5, y: 10 },
    showCancel: true,
  },
  render: (args) => (
      <PopoverUpload 
        {...args} 
        renderTarget={(props) => (
          <button {...props} style={{ padding: "4px" }} type="button">
            Target
          </button>
        )} 
      />
    ),
};